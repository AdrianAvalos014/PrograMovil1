// src/screens/reportes/ReportesScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES } from "../../../types";

// 🔐 Firebase Auth
import { auth } from "../../services/firebase-config";

// 🔹 Navegación (para saber cuándo la pantalla está en foco)
import { useIsFocused } from "@react-navigation/native";

// 🔹 Storage local offline-first
import {
  loadTasks,
  loadEventos,
  loadCompras,
  saveEventos,
  type StoredTask,
  type StoredEvento,
  type StoredCompra,
} from "../../config/localStorageConfig";

/* =======================================================
   🔥 VALIDACIÓN CORRECTA DE FECHAS (SOLUCIÓN DEL BUG)
   ======================================================= */

// Tareas: soporta D/M/Y, ISO, fallback id
function parseDMY(dmy: string): Date | null {
  const m = dmy.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day)
    return null;
  return d;
}

// Extrae fecha válida desde StoredTask
function getTaskDate(t: StoredTask): Date | null {
  const raw = t.fechaLimite?.trim();
  if (raw) {
    const dIso = new Date(raw);
    if (!Number.isNaN(dIso.getTime())) return dIso;
    const dDmy = parseDMY(raw);
    if (dDmy) return dDmy;
  }
  if (typeof t.id === "number") {
    const d = new Date(t.id);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

// EVENTOS: validación **real** YYYY-MM-DD
function getEventoDate(e: StoredEvento): Date | null {
  if (!e.fecha) return null;

  // Validación del formato YYYY-MM-DD
  const match = e.fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);

  // Construimos fecha real
  const date = new Date(y, m - 1, d);

  // Evitar que JS acomode fechas inválidas
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return date;
}

/* =======================================================
   ✅ COMPRAS (AJUSTADO A TU MODELO NUEVO)
   StoredCompra: { id, categoria, productos[], total, fecha }
   ======================================================= */

// COMPRAS: fecha desde c.fecha (fallback a id)
function compraFecha(c: StoredCompra): Date {
  const ts =
    typeof c?.fecha === "number" && Number.isFinite(c.fecha)
      ? c.fecha
      : Number(c?.id);

  return Number.isFinite(ts) ? new Date(ts) : new Date(0);
}

function compraFechaISO(c: StoredCompra): string {
  const d = compraFecha(c);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

// Total de compra: usa c.total si es válido; si no, recalcula con productos
function compraTotal(c: StoredCompra): number {
  if (typeof c?.total === "number" && Number.isFinite(c.total)) return c.total;

  const productos = Array.isArray(c?.productos) ? c.productos : [];
  return productos.reduce((acc, p) => {
    const cant =
      typeof p?.cantidad === "number" ? p.cantidad : Number(p?.cantidad);
    const price = typeof p?.precio === "number" ? p.precio : Number(p?.precio);
    const cCant = Number.isFinite(cant) ? cant : 0;
    const cPrice = Number.isFinite(price) ? price : 0;
    return acc + cCant * cPrice;
  }, 0);
}

// Comparación por mes
function isSameMonthDate(d: Date | null, year: number, month0: number) {
  return !!d && d.getFullYear() === year && d.getMonth() === month0;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const CATEGORIAS_REPORTE = [
  "Todas",
  "Supermercado",
  "Comida",
  "Transporte",
  "Ropa",
  "Salud",
  "Suscripciones",
  "Otros",
] as const;
type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number];

type FiltroTareas = "Todas" | "Completadas" | "Pendientes";
type OrdenFecha = "fechaAsc" | "fechaDesc";
type FiltroMonto = "Todas" | "Cara" | "Barata";

const ReportesScreen: React.FC = () => {
  const now = new Date();

  // Para saber si esta pantalla está visible/activa
  const isFocused = useIsFocused();

  // Usuario
  const [userId, setUserId] = useState(auth.currentUser?.uid ?? null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  // Mes seleccionado
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const labelMes = `${MESES[month0]} ${year}`;

  const [modalTipo, setModalTipo] = useState<
    "tareas" | "eventos" | "compras" | null
  >(null);

  // Datos
  const [tareas, setTareas] = useState<StoredTask[]>([]);
  const [eventos, setEventos] = useState<StoredEvento[]>([]);
  const [compras, setCompras] = useState<StoredCompra[]>([]);

  // Filtros
  const [tareasFiltro, setTareasFiltro] = useState<FiltroTareas>("Todas");
  const [tareasOrden, setTareasOrden] = useState<OrdenFecha>("fechaAsc");
  const [eventosOrden, setEventosOrden] = useState<OrdenFecha>("fechaAsc");
  const [comprasOrden, setComprasOrden] = useState<OrdenFecha>("fechaDesc");
  const [comprasFiltroCategoria, setComprasFiltroCategoria] =
    useState<CategoriaReporte>("Todas");
  const [comprasFiltroMonto, setComprasFiltroMonto] =
    useState<FiltroMonto>("Todas");

  /* =======================================================
     🔥 Carga Offline-First + Limpieza de eventos inválidos
     ======================================================= */
  useEffect(() => {
    if (!isFocused) return;

    (async () => {
      try {
        const [ts, ev, cp] = await Promise.all([
          loadTasks(userId),
          loadEventos(userId),
          loadCompras(userId),
        ]);

        // ✅ TAREAS: se recargan cada vez que vuelves a la pantalla
        setTareas(ts || []);

        // 🔥 Eliminamos eventos corruptos ANTES de continuar
        const eventosValidos = (ev || []).filter(
          (e) => getEventoDate(e) !== null
        );
        if (eventosValidos.length !== (ev || []).length) {
          // Guardamos limpieza en AsyncStorage
          await saveEventos(userId, eventosValidos);
        }
        setEventos(eventosValidos);

        // ✅ COMPRAS: igual que antes, solo recargadas al volver
        setCompras(cp || []);
      } catch (e) {
        console.log("[reportes] error cargando datos locales", e);
      }
    })();
  }, [userId, isFocused]);

  /* ============================ FILTROS DEL MES ============================ */

  const tareasMes = useMemo(
    () => tareas.filter((t) => isSameMonthDate(getTaskDate(t), year, month0)),
    [tareas, year, month0]
  );

  const eventosMes = useMemo(
    () =>
      eventos.filter((e) => {
        const d = getEventoDate(e);
        return d && isSameMonthDate(d, year, month0);
      }),
    [eventos, year, month0]
  );

  const comprasMes = useMemo(
    () => compras.filter((c) => isSameMonthDate(compraFecha(c), year, month0)),
    [compras, year, month0]
  );

  /* ============================ RESÚMENES ============================ */

  const totalTareas = tareasMes.length;
  const completadas = tareasMes.filter((t) => t.completada).length;
  const pendientes = totalTareas - completadas;
  const avance =
    totalTareas === 0 ? 0 : Math.round((completadas * 100) / totalTareas);

  const totalEventos = eventosMes.length;

  // ✅ TOTAL GASTO (usa compraTotal)
  const totalGasto = comprasMes.reduce((acc, c) => acc + compraTotal(c), 0);

  // ✅ GASTO POR CATEGORÍA (usa compraTotal)
  const gastoPorCategoria = comprasMes.reduce<Record<string, number>>(
    (acc, c) => {
      const totalCompra = compraTotal(c);
      acc[c.categoria] = (acc[c.categoria] || 0) + totalCompra;
      return acc;
    },
    {}
  );

  const categoriaTop =
    comprasMes.length === 0
      ? "Sin datos"
      : Object.entries(gastoPorCategoria).sort((a, b) => b[1] - a[1])[0][0];

  // Próximo evento
  const proximoEventoMes = useMemo(() => {
    if (!eventosMes.length) return null;
    return [...eventosMes].sort(
      (a, b) => getEventoDate(a)!.getTime() - getEventoDate(b)!.getTime()
    )[0];
  }, [eventosMes]);

  const cambiarMes = (delta: number) => {
    const d = new Date(year, month0, 1);
    d.setMonth(d.getMonth() + delta);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  };

  /* ============================ DETALLES ============================ */

  const tareasDetalle = useMemo(() => {
    let base = [...tareasMes];
    base.sort((a, b) => {
      const da = getTaskDate(a)?.getTime() ?? 0;
      const db = getTaskDate(b)?.getTime() ?? 0;
      return tareasOrden === "fechaAsc" ? da - db : db - da;
    });

    if (tareasFiltro === "Completadas") return base.filter((t) => t.completada);
    if (tareasFiltro === "Pendientes") return base.filter((t) => !t.completada);
    return base;
  }, [tareasMes, tareasFiltro, tareasOrden]);

  const eventosDetalle = useMemo(() => {
    let base = [...eventosMes];
    base.sort((a, b) => {
      const da = getEventoDate(a)!.getTime();
      const db = getEventoDate(b)!.getTime();
      return eventosOrden === "fechaAsc" ? da - db : db - da;
    });
    return base;
  }, [eventosMes, eventosOrden]);

  // ✅ COMPRAS DETALLE (filtros + orden usando compraTotal y compraFecha)
  const comprasDetalle = useMemo(() => {
    let base = [...comprasMes];

    if (comprasFiltroCategoria !== "Todas") {
      base = base.filter((c) => c.categoria === comprasFiltroCategoria);
    }
    if (!base.length) return [];

    const totales = base.map((c) => compraTotal(c));
    const max = Math.max(...totales);
    const min = Math.min(...totales);

    if (comprasFiltroMonto === "Cara")
      base = base.filter((c) => compraTotal(c) === max);
    else if (comprasFiltroMonto === "Barata")
      base = base.filter((c) => compraTotal(c) === min);

    base.sort((a, b) =>
      comprasOrden === "fechaAsc"
        ? compraFecha(a).getTime() - compraFecha(b).getTime()
        : compraFecha(b).getTime() - compraFecha(a).getTime()
    );

    return base;
  }, [comprasMes, comprasFiltroCategoria, comprasFiltroMonto, comprasOrden]);

  /* ============================ UI ============================ */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="red" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reportes mensuales</Text>
          <Text style={styles.headerSubtitle}>
            Resumen de tareas, eventos y gastos
          </Text>
        </View>
        <MaterialIcons name="insights" size={26} color="#fff" />
      </View>

      {/* SELECTOR DE MES */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => cambiarMes(-1)}
        >
          <MaterialIcons name="chevron-left" size={26} color="red" />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{labelMes}</Text>

        <TouchableOpacity
          style={styles.monthArrow}
          onPress={() => cambiarMes(1)}
        >
          <MaterialIcons name="chevron-right" size={26} color="red" />
        </TouchableOpacity>
      </View>

      {/* CARDS */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ===== TAREAS ===== */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <FontAwesome5 name="tasks" size={18} color="red" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Tareas del mes</Text>
              <Text style={styles.cardSubtitle}>
                Cómo vas con tus pendientes.
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalTareas}</Text>
              <Text style={styles.statLabel}>Tareas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{completadas}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{pendientes}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>

          <Text style={styles.smallLabel}>Progreso</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${avance}%` }]} />
          </View>
          <Text style={styles.progressText}>{avance}% completado</Text>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setModalTipo("tareas")}
          >
            <Text style={styles.detailButtonText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>

        {/* ===== EVENTOS ===== */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <FontAwesome5 name="calendar-alt" size={18} color="red" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Eventos del mes</Text>
              <Text style={styles.cardSubtitle}>
                Citas y actividades agendadas.
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalEventos}</Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>
          </View>

          <Text style={styles.smallLabel}>
            Próximo evento:
            <Text style={styles.highlightText}>
              {" "}
              {proximoEventoMes ? proximoEventoMes.titulo : "No hay eventos"}
            </Text>
          </Text>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setModalTipo("eventos")}
          >
            <Text style={styles.detailButtonText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>

        {/* ===== GASTOS ===== */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <FontAwesome5 name="shopping-cart" size={18} color="red" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Gastos del mes</Text>
              <Text style={styles.cardSubtitle}>
                Cuánto has gastado y en qué categorías.
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{comprasMes.length}</Text>
              <Text style={styles.statLabel}>Compras</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>${totalGasto.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total gastado</Text>
            </View>
          </View>

          <Text style={styles.smallLabel}>
            Categoría donde más gastas:
            <Text style={styles.highlightText}> {categoriaTop}</Text>
          </Text>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setModalTipo("compras")}
          >
            <Text style={styles.detailButtonText}>Ver detalle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* =================== MODALES =================== */}

      <Modal
        animationType="slide"
        transparent
        visible={modalTipo !== null}
        onRequestClose={() => setModalTipo(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {/* ===== MODAL TAREAS ===== */}
            {modalTipo === "tareas" && (
              <>
                <Text style={styles.modalTitle}>Tareas de {labelMes}</Text>

                <View style={styles.filtersRow}>
                  <Text style={styles.filterLabel}>Estado:</Text>
                  {(
                    ["Todas", "Completadas", "Pendientes"] as FiltroTareas[]
                  ).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.chip,
                        tareasFiltro === f && styles.chipActive,
                      ]}
                      onPress={() => setTareasFiltro(f)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          tareasFiltro === f && styles.chipTextActive,
                        ]}
                      >
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.filtersRow}>
                  <Text style={styles.filterLabel}>Orden:</Text>
                  {(["fechaAsc", "fechaDesc"] as OrdenFecha[]).map((o) => (
                    <TouchableOpacity
                      key={o}
                      style={[
                        styles.chip,
                        tareasOrden === o && styles.chipActive,
                      ]}
                      onPress={() => setTareasOrden(o)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          tareasOrden === o && styles.chipTextActive,
                        ]}
                      >
                        {o === "fechaAsc"
                          ? "Más antiguas primero"
                          : "Más recientes primero"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {tareasDetalle.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No hay tareas que coincidan con el filtro.
                  </Text>
                ) : (
                  <ScrollView style={{ maxHeight: 260 }}>
                    {tareasDetalle.map((t) => {
                      const d = getTaskDate(t);
                      const fechaTexto = t.fechaLimite
                        ? t.fechaLimite
                        : d
                        ? d.toLocaleDateString()
                        : "Sin fecha";

                      return (
                        <View key={t.id} style={styles.modalItem}>
                          <Text style={styles.modalItemTitle}>{t.titulo}</Text>
                          <Text style={styles.modalItemText}>
                            Fecha límite: {fechaTexto}
                          </Text>
                          <Text style={styles.modalItemText}>
                            Estado:{" "}
                            <Text style={styles.boldText}>
                              {t.completada ? "Completada" : "Pendiente"}
                            </Text>
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            {/* ===== MODAL EVENTOS ===== */}
            {modalTipo === "eventos" && (
              <>
                <Text style={styles.modalTitle}>Eventos de {labelMes}</Text>

                <View style={styles.filtersRow}>
                  <Text style={styles.filterLabel}>Orden:</Text>
                  {(["fechaAsc", "fechaDesc"] as OrdenFecha[]).map((o) => (
                    <TouchableOpacity
                      key={o}
                      style={[
                        styles.chip,
                        eventosOrden === o && styles.chipActive,
                      ]}
                      onPress={() => setEventosOrden(o)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          eventosOrden === o && styles.chipTextActive,
                        ]}
                      >
                        {o === "fechaAsc"
                          ? "Más antiguos primero"
                          : "Más recientes primero"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {eventosDetalle.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No hay eventos registrados este mes.
                  </Text>
                ) : (
                  <ScrollView style={{ maxHeight: 260 }}>
                    {eventosDetalle.map((e) => (
                      <View key={e.id} style={styles.modalItem}>
                        <Text style={styles.modalItemTitle}>{e.titulo}</Text>
                        <Text style={styles.modalItemText}>
                          Fecha: {e.fecha} · Hora: {e.hora}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* ===== MODAL COMPRAS ===== */}
            {modalTipo === "compras" && (
              <>
                <Text style={styles.modalTitle}>Gastos de {labelMes}</Text>

                {comprasMes.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No hay compras registradas este mes.
                  </Text>
                ) : (
                  <>
                    {/* Categorías */}
                    <View style={styles.filtersRowWrap}>
                      <Text style={styles.filterLabel}>Categoría:</Text>
                      <View style={styles.chipRowWrap}>
                        {CATEGORIAS_REPORTE.map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.chip,
                              comprasFiltroCategoria === cat &&
                                styles.chipActive,
                            ]}
                            onPress={() =>
                              setComprasFiltroCategoria(cat as CategoriaReporte)
                            }
                          >
                            <Text
                              style={[
                                styles.chipText,
                                comprasFiltroCategoria === cat &&
                                  styles.chipTextActive,
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Orden */}
                    <View style={styles.filtersRow}>
                      <Text style={styles.filterLabel}>Orden:</Text>
                      {(["fechaAsc", "fechaDesc"] as OrdenFecha[]).map((o) => (
                        <TouchableOpacity
                          key={o}
                          style={[
                            styles.chip,
                            comprasOrden === o && styles.chipActive,
                          ]}
                          onPress={() => setComprasOrden(o)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              comprasOrden === o && styles.chipTextActive,
                            ]}
                          >
                            {o === "fechaAsc"
                              ? "Más antiguas primero"
                              : "Más recientes primero"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Monto */}
                    <View style={styles.filtersRow}>
                      <Text style={styles.filterLabel}>Monto total:</Text>
                      {(["Todas", "Cara", "Barata"] as FiltroMonto[]).map(
                        (m) => (
                          <TouchableOpacity
                            key={m}
                            style={[
                              styles.chip,
                              comprasFiltroMonto === m && styles.chipActive,
                            ]}
                            onPress={() => setComprasFiltroMonto(m)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                comprasFiltroMonto === m &&
                                  styles.chipTextActive,
                              ]}
                            >
                              {m === "Todas"
                                ? "Todas"
                                : m === "Cara"
                                ? "Compra más cara"
                                : "Compra más barata"}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>

                    <ScrollView style={{ maxHeight: 220 }}>
                      {comprasDetalle.length === 0 ? (
                        <Text style={styles.emptyText}>
                          No hay compras que coincidan con los filtros.
                        </Text>
                      ) : (
                        comprasDetalle.map((c) => {
                          const totalCompra = compraTotal(c);
                          const productos = Array.isArray(c?.productos)
                            ? c.productos
                            : [];

                          return (
                            <View key={c.id} style={styles.modalItem}>
                              {/* Título de la compra */}
                              <Text style={styles.modalItemTitle}>
                                {c.categoria || "Compra"}
                              </Text>

                              {/* Fecha */}
                              <Text style={styles.modalItemText}>
                                Fecha: {compraFechaISO(c)}
                              </Text>

                              {/* Total */}
                              <Text style={styles.modalItemText}>
                                Total:{" "}
                                <Text style={styles.boldText}>
                                  ${Number(totalCompra).toFixed(2)}
                                </Text>
                              </Text>

                              {/* Productos */}
                              {productos.length === 0 ? (
                                <Text style={styles.modalItemText}>
                                  (Sin productos)
                                </Text>
                              ) : (
                                productos.map((p) => {
                                  const cant =
                                    typeof p?.cantidad === "number"
                                      ? p.cantidad
                                      : Number(p?.cantidad);
                                  const price =
                                    typeof p?.precio === "number"
                                      ? p.precio
                                      : Number(p?.precio);

                                  const cCant = Number.isFinite(cant)
                                    ? cant
                                    : 0;
                                  const cPrice = Number.isFinite(price)
                                    ? price
                                    : 0;

                                  return (
                                    <Text
                                      key={p.id}
                                      style={styles.modalItemText}
                                    >
                                      • {p.descripcion} · Cant: {cCant} · $
                                      {cPrice.toFixed(2)}
                                    </Text>
                                  );
                                })
                              )}
                            </View>
                          );
                        })
                      )}
                    </ScrollView>

                    <Text style={[styles.modalItemText, { marginTop: 8 }]}>
                      Total gastado:{" "}
                      <Text style={styles.boldText}>
                        ${Number(totalGasto).toFixed(2)}
                      </Text>
                    </Text>

                    {Object.entries(gastoPorCategoria).map(([cat, val]) => (
                      <Text key={cat} style={styles.modalItemText}>
                        • {cat}: ${Number(val).toFixed(2)}
                      </Text>
                    ))}
                  </>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalTipo(null)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
/* ============================ ESTILOS ============================ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige" },
  header: {
    backgroundColor: "red",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.small,
    color: "#ffe",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FFF3E0",
  },
  monthArrow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  monthLabel: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "red",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE6E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.small,
    color: "#777",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "red",
  },
  statLabel: {
    fontSize: FONT_SIZES.small,
    color: "#555",
    marginTop: 2,
  },
  smallLabel: {
    marginTop: 10,
    fontSize: FONT_SIZES.small,
    color: "#444",
  },
  highlightText: {
    fontWeight: "bold",
    color: "red",
  },
  progressBarBackground: {
    marginTop: 6,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "red",
  },
  progressText: {
    marginTop: 4,
    fontSize: FONT_SIZES.small,
    color: "#555",
  },
  detailButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    backgroundColor: "red",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  detailButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.small,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  modalItemTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: "#333",
  },
  modalItemText: {
    fontSize: FONT_SIZES.small,
    color: "#555",
  },
  emptyText: {
    fontSize: FONT_SIZES.small,
    color: "#777",
    textAlign: "center",
    marginVertical: 16,
  },
  boldText: {
    fontWeight: "bold",
  },
  modalCloseButton: {
    marginTop: 14,
    alignSelf: "center",
    backgroundColor: "red",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  filtersRowWrap: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: FONT_SIZES.small,
    color: "#444",
    marginRight: 6,
  },
  chipRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 6,
    marginTop: 4,
  },
  chipActive: {
    backgroundColor: "red",
    borderColor: "red",
  },
  chipText: {
    fontSize: FONT_SIZES.small,
    color: "#444",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ReportesScreen;
