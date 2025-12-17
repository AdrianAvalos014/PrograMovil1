import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { FONT_SIZES } from "../../../types";

// 🔐 Firebase
import { auth, db } from "../../services/firebase-config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

// 💾 Local storage
import {
  loadTasks,
  saveTasks,
  type StoredTask,
  type Prioridad,
} from "../../config/localStorageConfig";

interface Tarea extends StoredTask {}
type Filtro = "Todas" | "Pendientes" | "Completadas";

const PRIORIDADES: Prioridad[] = ["Baja", "Media", "Alta"];

/* ======================================================
   🔔 NOTIFICACIONES – HELPERS
   Formato esperado: "DD/MM/YYYY"
====================================================== */

const parseFechaLimite = (fecha: string): Date | null => {
  const parts = fecha.split("/");
  if (parts.length !== 3) return null;

  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;

  // Hora fija 9:00 AM para "mañana se entrega"
  const dt = new Date(y, m - 1, d, 9, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
};

const cancelTaskNotifications = async (taskId: number) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      const data: any = n?.content?.data;
      if (data?.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.log("[tasks] cancelTaskNotifications error", e);
  }
};

const scheduleTaskNotifications = async (tarea: Tarea) => {
  if (!tarea.fechaLimite) return;

  const fecha = parseFechaLimite(tarea.fechaLimite);
  if (!fecha) return;

  // Pedimos permiso (si ya lo concedieron, no molesta)
  const perm = await Notifications.requestPermissionsAsync();
  if (perm.status !== "granted") return;

  // Si la tarea se edita, cancelamos las anteriores
  await cancelTaskNotifications(tarea.id);

  const now = new Date();

  // 📅 1 día antes (9AM)
  const dayBefore = new Date(fecha);
  dayBefore.setDate(fecha.getDate() - 1);

  // ⏰ 1 hora antes (de la hora fija 9AM => 8AM)
  const hourBefore = new Date(fecha);
  hourBefore.setHours(fecha.getHours() - 1);

  if (dayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📌 Tarea próxima",
        body: `Mañana se entrega: ${tarea.titulo}`,
        data: { taskId: tarea.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dayBefore,
      },
    });
  }

  if (hourBefore > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Tarea urgente",
        body: `En 1 hora se entrega: ${tarea.titulo}`,
        data: { taskId: tarea.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: hourBefore,
      },
    });
  }
};

/* ======================================================
   🎨 UI HELPERS
====================================================== */

const prioridadColor = (p: Prioridad) => {
  switch (p) {
    case "Alta":
      return "#F44336";
    case "Media":
      return "#FF9800";
    case "Baja":
    default:
      return "#4CAF50";
  }
};

const daysLeftLabel = (fechaLimite?: string) => {
  if (!fechaLimite) return null;
  const dt = parseFechaLimite(fechaLimite);
  if (!dt) return null;

  const today = new Date();
  // normalizamos a medianoche para cálculo de días
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

  const diffMs = b.getTime() - a.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: "Vencida", color: "#B71C1C" };
  if (days === 0) return { text: "Hoy", color: "#E53935" };
  if (days === 1) return { text: "Mañana", color: "#FB8C00" };
  return { text: `En ${days} días`, color: "#546E7A" };
};

const TareasScreen: React.FC = () => {
  // ===== Usuario actual =====
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  // ===== Estado de tareas =====
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todas");

  // Modal / formulario
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("Media");

  // Para evitar spam de botón
  const [saving, setSaving] = useState(false);

  /* ===================== LOAD LOCAL ===================== */
  useEffect(() => {
    (async () => {
      const local = await loadTasks(userId);
      if (local.length) setTareas(local);
    })();
  }, [userId]);

  /* ===================== FIRESTORE REALTIME ===================== */
  useEffect(() => {
    if (!userId) return;

    const colRef = collection(db, "users", userId, "tasks");

    // Seed si está vacío en la nube
    (async () => {
      try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
          const local = await loadTasks(userId);
          for (const t of local) {
            setDoc(doc(colRef, String(t.id)), t, { merge: true }).catch(
              () => {}
            );
          }
        }
      } catch (e) {
        console.log("[tasks] seed error", e);
      }
    })();

    const unsub = onSnapshot(
      colRef,
      async (snap) => {
        const cloud: Tarea[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const id =
            typeof data.id === "number" ? data.id : Number(d.id) || Date.now();
          return { ...data, id } as Tarea;
        });

        setTareas(cloud);
        await saveTasks(userId, cloud);
      },
      (err) => console.log("[tasks] snapshot err", err)
    );

    return () => unsub();
  }, [userId]);

  const persistLocal = async (next: Tarea[]) => {
    setTareas(next);
    await saveTasks(userId, next);
  };

  /* ===================== DERIVADOS ===================== */
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      const okFiltro =
        filtro === "Todas"
          ? true
          : filtro === "Pendientes"
          ? !t.completada
          : t.completada;

      const term = busqueda.trim().toLowerCase();
      const okSearch =
        !term ||
        t.titulo.toLowerCase().includes(term) ||
        (t.descripcion || "").toLowerCase().includes(term);

      return okFiltro && okSearch;
    });
  }, [tareas, filtro, busqueda]);

  const totalPendientes = useMemo(
    () => tareas.filter((t) => !t.completada).length,
    [tareas]
  );
  const totalCompletadas = useMemo(
    () => tareas.filter((t) => t.completada).length,
    [tareas]
  );

  /* ===================== FORM ===================== */
  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setFechaLimite("");
    setPrioridad("Media");
    setEditingTask(null);
  };

  const abrirModalNueva = () => {
    resetForm();
    setModalVisible(true);
  };

  const abrirModalEditar = (t: Tarea) => {
    setEditingTask(t);
    setTitulo(t.titulo);
    setDescripcion(t.descripcion || "");
    setFechaLimite(t.fechaLimite || "");
    setPrioridad(t.prioridad);
    setModalVisible(true);
  };

  const handleGuardar = async () => {
    if (saving) return;
    if (!titulo.trim()) {
      Alert.alert("Error", "La tarea debe tener un título.");
      return;
    }

    setSaving(true);

    try {
      let tareaFinal: Tarea;

      if (editingTask) {
        tareaFinal = {
          ...editingTask,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fechaLimite: fechaLimite.trim(),
          prioridad,
        };

        const next = tareas.map((t) =>
          t.id === tareaFinal.id ? tareaFinal : t
        );
        await persistLocal(next);

        if (userId) {
          setDoc(
            doc(db, "users", userId, "tasks", String(tareaFinal.id)),
            tareaFinal,
            {
              merge: true,
            }
          ).catch((e) => console.log("[tasks] setDoc(edit) error", e));
        }
      } else {
        tareaFinal = {
          id: Date.now(),
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fechaLimite: fechaLimite.trim(),
          prioridad,
          completada: false,
        };

        const next = [tareaFinal, ...tareas];
        await persistLocal(next);

        if (userId) {
          setDoc(
            doc(db, "users", userId, "tasks", String(tareaFinal.id)),
            tareaFinal,
            {
              merge: true,
            }
          ).catch((e) => console.log("[tasks] setDoc(new) error", e));
        }
      }

      // 🔔 Programar recordatorios si hay fecha
      await scheduleTaskNotifications(tareaFinal);

      setModalVisible(false);
      resetForm();

      Alert.alert(
        "Tareas",
        "Guardado ✅ (si no hay internet, se sincroniza cuando vuelva)."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = (id: number) => {
    const t = tareas.find((x) => x.id === id);
    if (!t) return;

    Alert.alert("Eliminar tarea", `¿Eliminar "${t.titulo}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const next = tareas.filter((x) => x.id !== id);
          await persistLocal(next);

          // 🔔 cancelar recordatorios
          await cancelTaskNotifications(id);

          if (userId) {
            deleteDoc(doc(db, "users", userId, "tasks", String(id))).catch(
              (e) => console.log("[tasks] deleteDoc error", e)
            );
          }
        },
      },
    ]);
  };

  const handleToggleCompletada = async (id: number) => {
    const next = tareas.map((t) =>
      t.id === id ? { ...t, completada: !t.completada } : t
    );
    await persistLocal(next);

    if (userId) {
      const updated = next.find((t) => t.id === id);
      if (updated) {
        setDoc(doc(db, "users", userId, "tasks", String(updated.id)), updated, {
          merge: true,
        }).catch((e) => console.log("[tasks] setDoc(toggle) error", e));
      }
    }
  };

  /* ===================== RENDER ITEM ===================== */
  const renderTarea = ({ item }: { item: Tarea }) => {
    const left = daysLeftLabel(item.fechaLimite);

    return (
      <View style={styles.taskCard}>
        <TouchableOpacity
          style={styles.checkWrap}
          onPress={() => handleToggleCompletada(item.id)}
          activeOpacity={0.8}
        >
          <View
            style={[styles.checkbox, item.completada && styles.checkboxChecked]}
          >
            {item.completada ? (
              <MaterialIcons name="check" size={16} color="white" />
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.taskInfo}>
          <View style={styles.taskTopRow}>
            <Text
              style={[
                styles.taskTitle,
                item.completada && styles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {item.titulo}
            </Text>

            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: prioridadColor(item.prioridad) },
              ]}
            >
              <Text style={styles.priorityText}>{item.prioridad}</Text>
            </View>
          </View>

          {item.descripcion ? (
            <Text
              style={[
                styles.taskDesc,
                item.completada && styles.taskDescCompleted,
              ]}
              numberOfLines={2}
            >
              {item.descripcion}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {item.fechaLimite ? (
              <View style={styles.metaItem}>
                <MaterialIcons name="event" size={14} color="#777" />
                <Text style={styles.metaText}> {item.fechaLimite}</Text>
              </View>
            ) : (
              <View style={styles.metaItem}>
                <MaterialIcons name="event-busy" size={14} color="#B0B0B0" />
                <Text style={[styles.metaText, { color: "#B0B0B0" }]}>
                  {" "}
                  Sin fecha
                </Text>
              </View>
            )}

            {left ? (
              <View style={[styles.leftBadge, { borderColor: left.color }]}>
                <Text style={[styles.leftText, { color: left.color }]}>
                  {left.text}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => abrirModalEditar(item)}
          >
            <MaterialIcons name="edit" size={22} color="#FFB300" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => handleEliminar(item.id)}
          >
            <MaterialIcons name="delete" size={22} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ===================== UI ===================== */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="red" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gestión de Tareas</Text>
          <Text style={styles.headerSub}>Organiza tu día como un pro ✨</Text>
        </View>
        <FontAwesome5 name="tasks" size={28} color="white" />
      </View>

      {/* Resumen */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendientes</Text>
          <Text style={styles.summaryValue}>{totalPendientes}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completadas</Text>
          <Text style={styles.summaryValue}>{totalCompletadas}</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tarea..."
          placeholderTextColor="#999"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length ? (
          <TouchableOpacity
            onPress={() => setBusqueda("")}
            style={styles.clearBtn}
          >
            <MaterialIcons name="close" size={18} color="#777" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {(["Todas", "Pendientes", "Completadas"] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filtro === f && styles.filterChipActive]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.filterText,
                filtro === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <View style={styles.listWrap}>
        {tareasFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="clipboard-list" size={40} color="#cfcfcf" />
            <Text style={styles.emptyTitle}>Sin tareas aún</Text>
            <Text style={styles.emptySub}>
              Crea tu primera tarea con el botón +
            </Text>
          </View>
        ) : (
          <FlatList
            data={tareasFiltradas}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderTarea}
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={abrirModalNueva}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalBg}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {editingTask ? "Editar tarea" : "Nueva tarea"}
                </Text>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Entregar reporte"
                  placeholderTextColor="#999"
                  value={titulo}
                  onChangeText={setTitulo}
                />

                <Text style={styles.label}>Descripción (opcional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 90, textAlignVertical: "top" },
                  ]}
                  placeholder="Detalles, pasos, etc."
                  placeholderTextColor="#999"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                />

                <Text style={styles.label}>Fecha límite (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 30/11/2025"
                  placeholderTextColor="#999"
                  value={fechaLimite}
                  onChangeText={setFechaLimite}
                  keyboardType="default"
                />

                <Text style={styles.label}>Prioridad</Text>
                <View style={styles.priorityRow}>
                  {PRIORIDADES.map((p) => {
                    const active = prioridad === p;
                    const c = prioridadColor(p);
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.priorityChip,
                          active && { backgroundColor: c, borderColor: c },
                        ]}
                        onPress={() => setPrioridad(p)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.priorityChipText,
                            active && { color: "white" },
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.modalBtnsRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#F44336" }]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.modalBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: saving ? "#9E9E9E" : "#4CAF50" },
                    ]}
                    onPress={handleGuardar}
                    disabled={saving}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.modalBtnText}>
                      {editingTask ? "Guardar cambios" : "Guardar"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalHint}>
                  Tip: si pones fecha, se crean recordatorios (mañana y 1 hora
                  antes).
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TareasScreen;

/* ======================================================
   🎨 ESTILOS (BONITOS)
====================================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige" },

  header: {
    backgroundColor: "red",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "white",
  },
  headerSub: {
    marginTop: 2,
    fontSize: FONT_SIZES.small,
    color: "#f5f5f5",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    elevation: 2,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.small,
    color: "#777",
  },
  summaryValue: {
    marginTop: 4,
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "red",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: FONT_SIZES.medium,
    color: "#333",
  },
  clearBtn: {
    padding: 6,
    borderRadius: 14,
  },

  filtersRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "white",
  },
  filterChipActive: {
    backgroundColor: "red",
    borderColor: "red",
  },
  filterText: {
    fontSize: FONT_SIZES.small,
    color: "#555",
  },
  filterTextActive: {
    color: "white",
    fontWeight: "bold",
  },

  listWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },

  taskCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  checkWrap: { paddingRight: 10, justifyContent: "center" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "red" },

  taskInfo: { flex: 1 },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    fontWeight: "700",
    color: "#333",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
  },
  taskDesc: {
    marginTop: 4,
    fontSize: FONT_SIZES.small,
    color: "#666",
  },
  taskDescCompleted: {
    textDecorationLine: "line-through",
    color: "#B0B0B0",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "space-between",
  },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: FONT_SIZES.small, color: "#777" },

  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: FONT_SIZES.small,
    color: "white",
    fontWeight: "bold",
  },

  leftBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  leftText: {
    fontSize: FONT_SIZES.small,
    fontWeight: "700",
  },

  actionsCol: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  iconBtn: { padding: 6 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: FONT_SIZES.medium,
    fontWeight: "700",
    color: "#555",
  },
  emptySub: {
    marginTop: 4,
    fontSize: FONT_SIZES.small,
    color: "#888",
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 18,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 18,
    elevation: 6,
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#111",
  },
  label: {
    fontSize: FONT_SIZES.small,
    marginBottom: 6,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: FONT_SIZES.medium,
    backgroundColor: "white",
  },

  priorityRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "white",
  },
  priorityChipText: {
    fontSize: FONT_SIZES.small,
    color: "#555",
    fontWeight: "700",
  },

  modalBtnsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  modalBtnText: {
    color: "white",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  modalHint: {
    marginTop: 12,
    fontSize: FONT_SIZES.small,
    color: "#777",
    textAlign: "center",
  },
});
