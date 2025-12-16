// // // src/screens/agenda/AgendaScreen.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ScrollView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import { auth, db } from "../../services/firebase-config";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

import {
  loadEventos,
  saveEventos,
  type StoredEvento,
} from "../../config/localStorageConfig";
import { enqueueOperation } from "../../services/syncService";

/* =======================
   Utilidades de fecha
   ======================= */
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayISO() {
  return toISO(new Date());
}
function monthMatrix(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month0, d));
  while (cells.length < 42) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
  return rows;
}
function monthLabel(year: number, month0: number) {
  const MES = [
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
  return `${MES[month0]} ${year}`;
}

/* =======================
   Tipos
   ======================= */
type Evento = StoredEvento; // mantiene compatibilidad con localStorage types

const AgendaScreen: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  // UI state
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modo, setModo] = useState<"registrar" | "editar">("registrar");
  const [titulo, setTitulo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Hora desglosada
  const [hourPart, setHourPart] = useState<string>(""); // "1" .. "12"
  const [minutePart, setMinutePart] = useState<string>(""); // "00" .. "59"
  const [amPm, setAmPm] = useState<"AM" | "PM">("AM");

  // calendario
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth0, setCalMonth0] = useState<number>(new Date().getMonth());

  const calRows = useMemo(
    () => monthMatrix(calYear, calMonth0),
    [calYear, calMonth0]
  );

  // Próximo evento (derivado)
  const proximo = useMemo(() => {
    const hoy = todayISO();
    const ordenados = [...eventos].sort((a, b) =>
      a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0
    );
    return ordenados.find((e) => e.fecha >= hoy);
  }, [eventos]);

  /* =======================
     Offline-first: carga local + snapshot cloud
     ======================= */

  // 1) Suscribir cambios de sesión (uid)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  // 2) Cargar local al inicio / cuando cambia userId
  useEffect(() => {
    (async () => {
      try {
        const local = await loadEventos(userId);
        if (local && local.length) setEventos(local);
      } catch (e) {
        console.log("[agenda] load local error", e);
      }
    })();
  }, [userId]);

  // 3) Snapshot Firestore + sembrar si vacío (igual que Medicamentos)
  useEffect(() => {
    if (!userId) return;

    const colRef = collection(db, "users", userId, "events"); // collection name: "events"

    // Sembrar Firestore si está vacío: subir local -> cloud
    (async () => {
      try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
          const local = await loadEventos(userId);
          for (const ev of local) {
            await setDoc(doc(colRef, ev.id), ev, { merge: true }).catch(
              () => {}
            );
          }
        }
      } catch (e) {
        console.log("[agenda] seed check error", e);
      }
    })();

    // Listener: cloud -> UI + local
    const unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        try {
          const cloud: Evento[] = snapshot.docs.map((d) => ({
            ...(d.data() as Evento),
            id: d.id,
          }));
          setEventos(cloud);
          await saveEventos(userId, cloud);
        } catch (e) {
          console.log("[agenda] snapshot handler error", e);
        }
      },
      (err) => console.log("[agenda] snapshot err:", err)
    );

    return () => unsub();
  }, [userId]);

  /* =======================
     Helpers locales y de sync
     ======================= */
  const persistLocal = async (next: Evento[]) => {
    setEventos(next);
    try {
      await saveEventos(userId, next);
    } catch (e) {
      console.log("[agenda] saveEventos error", e);
    }
  };

  /* =======================
     Form / CRUD (manteniendo UI)
     ======================= */
  function onChangeHour(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setHourPart("");
      return;
    }
    let n = parseInt(digits, 10);
    if (isNaN(n)) {
      setHourPart("");
      return;
    }
    if (n < 1) n = 1;
    if (n > 12) n = 12;
    setHourPart(String(n));
  }

  function onChangeMinute(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setMinutePart("");
      return;
    }
    let n = parseInt(digits, 10);
    if (isNaN(n)) {
      setMinutePart("");
      return;
    }
    if (n < 0) n = 0;
    if (n > 59) n = 59;
    setMinutePart(pad(n));
  }

  function abrirEditar(e: Evento) {
    setModo("editar");
    setTitulo(e.titulo);
    setComentarios(e.comentarios || "");
    setEditId(e.id);

    const m = e.hora.match(
      /^\s*([0-9]{1,2})\s*:\s*([0-9]{1,2})\s*([AaPp][Mm])\s*$/
    );
    if (m) {
      let hh = parseInt(m[1], 10);
      let mm = parseInt(m[2], 10);
      const ampm = (m[3] || "AM").toUpperCase();
      if (hh < 1) hh = 1;
      if (hh > 12) hh = ((hh - 1) % 12) + 1;
      if (mm < 0) mm = 0;
      if (mm > 59) mm = 59;
      setHourPart(String(hh));
      setMinutePart(pad(mm));
      setAmPm(ampm === "PM" ? "PM" : "AM");
    } else {
      setHourPart("");
      setMinutePart("");
      setAmPm("AM");
    }

    setModalVisible(true);
  }

  function abrirRegistrar() {
    setModo("registrar");
    setTitulo("");
    setComentarios("");
    setHourPart("");
    setMinutePart("");
    setAmPm("AM");
    setEditId(null);
    setModalVisible(true);
  }

  async function guardar() {
    if (!titulo.trim()) {
      Alert.alert("Faltan datos", "Ingresa un título para el evento.");
      return;
    }
    if (!hourPart || !minutePart) {
      Alert.alert("Faltan datos", "Ingresa la hora completa (hora y minutos).");
      return;
    }

    const horaFinal = `${parseInt(hourPart, 10)}:${minutePart} ${amPm}`;

    try {
      if (modo === "registrar") {
        const nuevo: Evento = {
          id: `${Date.now()}`,
          titulo: titulo.trim(),
          fecha: selectedDate,
          hora: horaFinal,
          comentarios: comentarios.trim() || undefined,
        };

        const next = [nuevo, ...eventos];
        await persistLocal(next);

        if (userId) {
          const op = {
            id: `op_${Date.now()}`,
            userId,
            collection: "events" as const,
            docId: nuevo.id,
            type: "CREATE_OR_UPDATE" as const,
            payload: nuevo,
            timestamp: Date.now(),
          };
          enqueueOperation(op).catch(() => {});

          // 🔥 IMPORTANTE: SIN await
          setDoc(doc(db, "users", userId, "events", nuevo.id), nuevo, {
            merge: true,
          }).catch(() => {});
        }

        Alert.alert(
          "Eventos",
          "Evento registrado. Si no hay conexión, se sincronizará después."
        );
      } else if (modo === "editar" && editId) {
        const updated: Evento = {
          id: editId,
          titulo: titulo.trim(),
          fecha: selectedDate,
          hora: horaFinal,
          comentarios: comentarios.trim() || undefined,
        };

        const next = eventos.map((e) => (e.id === editId ? updated : e));
        await persistLocal(next);

        if (userId) {
          const op = {
            id: `op_${Date.now()}`,
            userId,
            collection: "events" as const,
            docId: updated.id,
            type: "CREATE_OR_UPDATE" as const,
            payload: updated,
            timestamp: Date.now(),
          };
          enqueueOperation(op).catch(() => {});

          setDoc(doc(db, "users", userId, "events", updated.id), updated, {
            merge: true,
          }).catch(() => {});
        }

        Alert.alert(
          "Eventos",
          "Evento actualizado. Si no hay conexión, se sincronizará después."
        );
      }
    } finally {
      // 🔥 ESTO ES TODO EL ARREGLO
      setModalVisible(false);
    }
  }

  async function eliminar(e: Evento) {
    Alert.alert("Confirmar", `¿Eliminar "${e.titulo}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const next = eventos.filter((x) => x.id !== e.id);
          await persistLocal(next);

          if (userId) {
            const op = {
              id: `op_${Date.now()}`,
              userId,
              collection: "events" as const,
              docId: e.id,
              type: "DELETE" as const,
              timestamp: Date.now(),
            };
            enqueueOperation(op).catch((err) =>
              console.log("[agenda] enqueue delete err", err)
            );

            try {
              await deleteDoc(doc(db, "users", userId, "events", e.id));
            } catch (err) {
              console.log("[agenda] immediate delete failed (enqueued)", err);
            }
          }
        },
      },
    ]);
  }

  function gotoPrevMonth() {
    const d = new Date(calYear, calMonth0, 1);
    d.setMonth(d.getMonth() - 1);
    setCalYear(d.getFullYear());
    setCalMonth0(d.getMonth());
  }
  function gotoNextMonth() {
    const d = new Date(calYear, calMonth0, 1);
    d.setMonth(d.getMonth() + 1);
    setCalYear(d.getFullYear());
    setCalMonth0(d.getMonth());
  }

  const eventosDelDia = eventos.filter((ev) => ev.fecha === selectedDate);

  /* =======================
     Render (misma UI)
     ======================= */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#D32F2F" barStyle="light-content" />

      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.nextEventCard}>
              <Text style={styles.nextEventTitle}>
                Tu próximo evento es el:
              </Text>
              {proximo ? (
                <>
                  <Text style={styles.eventName}>{proximo.titulo}</Text>
                  <Text style={styles.eventDate}>
                    {proximo.fecha} a las {proximo.hora}
                  </Text>
                </>
              ) : (
                <Text style={styles.noEventText}>Aún no tienes eventos.</Text>
              )}
            </View>

            <View style={styles.calendarCard}>
              <View style={styles.calHeader}>
                <TouchableOpacity onPress={gotoPrevMonth}>
                  <FontAwesome5 name="chevron-left" />
                </TouchableOpacity>
                <Text style={styles.calTitle}>
                  {monthLabel(calYear, calMonth0)}
                </Text>
                <TouchableOpacity onPress={gotoNextMonth}>
                  <FontAwesome5 name="chevron-right" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekHeader}>
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <Text key={d} style={styles.weekCell}>
                    {d}
                  </Text>
                ))}
              </View>

              {calRows.map((row, i) => (
                <View key={i} style={styles.weekRow}>
                  {row.map((cell, j) => {
                    const iso = cell ? toISO(cell) : "";
                    const isSelected = iso === selectedDate;
                    return (
                      <TouchableOpacity
                        key={j}
                        style={[
                          styles.dayCell,
                          isSelected && styles.daySelected,
                        ]}
                        onPress={() => cell && setSelectedDate(iso)}
                        disabled={!cell}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {cell ? cell.getDate() : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              <Text style={styles.selectedText}>
                Fecha seleccionada: {selectedDate}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.bigBtn, styles.btnGreen]}
              onPress={abrirRegistrar}
            >
              <Text style={styles.bigBtnText}>Registrar Evento</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>— o —</Text>

            <Text style={styles.sectionTitle}>Eventos del {selectedDate}</Text>
          </>
        }
        data={eventosDelDia}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.titulo}</Text>
              <Text style={styles.itemDetail}>
                {item.fecha} — {item.hora}
              </Text>
              {item.comentarios ? (
                <Text style={styles.itemComments}>
                  Comentarios: {item.comentarios}
                </Text>
              ) : null}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => abrirEditar(item)}
                style={[styles.smallBtn, styles.btnBlue]}
              >
                <Text style={styles.smallBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => eliminar(item)}
                style={[styles.smallBtn, styles.btnRed]}
              >
                <Text style={styles.smallBtnText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noEventText}>No hay eventos para este día.</Text>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {modo === "registrar" ? "Registrar evento" : "Editar evento"}
              </Text>

              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Reunión semanal"
                value={titulo}
                onChangeText={setTitulo}
              />

              <Text style={styles.label}>Hora</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="HH"
                  keyboardType="numeric"
                  maxLength={2}
                  value={hourPart}
                  onChangeText={onChangeHour}
                />
                <Text style={{ fontSize: 18, alignSelf: "center" }}>:</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="MM"
                  keyboardType="numeric"
                  maxLength={2}
                  value={minutePart}
                  onChangeText={onChangeMinute}
                />

                <View style={styles.amPmGroup}>
                  <TouchableOpacity
                    style={[
                      styles.amPmBtn,
                      amPm === "AM"
                        ? styles.amPmSelected
                        : styles.amPmUnselected,
                    ]}
                    onPress={() => setAmPm("AM")}
                  >
                    <Text
                      style={[
                        styles.amPmText,
                        amPm === "AM" ? styles.amPmTextSelected : {},
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.amPmBtn,
                      amPm === "PM"
                        ? styles.amPmSelected
                        : styles.amPmUnselected,
                    ]}
                    onPress={() => setAmPm("PM")}
                  >
                    <Text
                      style={[
                        styles.amPmText,
                        amPm === "PM" ? styles.amPmTextSelected : {},
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Comentarios (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Notas adicionales..."
                value={comentarios}
                onChangeText={setComentarios}
              />

              <Text style={styles.helper}>
                * Se guardará con la fecha seleccionada:{" "}
                <Text style={{ fontWeight: "800" }}>{selectedDate}</Text>
              </Text>

              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.btnGreen]}
                  onPress={guardar}
                >
                  <Text style={styles.bigBtnText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.btnRed]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.bigBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
};

/* =======================
   Estilos — sin cambios de UI
   ======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F2DF" },

  nextEventCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0C090",
    padding: 24,
    margin: 16,
    elevation: 3,
  },
  nextEventTitle: { fontWeight: "800", fontSize: 18, color: "#333" },
  eventName: { fontSize: 22, fontWeight: "900", color: "#222", marginTop: 6 },
  eventDate: { color: "#555", fontSize: 16, marginTop: 4 },
  noEventText: { textAlign: "center", color: "#777", marginTop: 6 },

  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEDAC1",
    backgroundColor: "#fff",
    padding: 10,
  },
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  calTitle: { fontWeight: "800" },
  weekHeader: { flexDirection: "row" },
  weekCell: { flex: 1, textAlign: "center", fontWeight: "700", color: "#666" },
  weekRow: { flexDirection: "row" },
  dayCell: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    margin: 1,
    borderRadius: 6,
  },
  daySelected: { backgroundColor: "#FFE3D7", borderColor: "#FFBCA8" },
  dayText: { fontWeight: "700" },
  dayTextSelected: { color: "#000" },
  selectedText: {
    textAlign: "center",
    marginTop: 6,
    color: "#333",
    fontWeight: "700",
  },

  bigBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  bigBtnText: { color: "#fff", fontWeight: "700" },
  btnGreen: { backgroundColor: "#4CAF50" },
  btnRed: { backgroundColor: "#D32F2F" },
  btnBlue: { backgroundColor: "#2196F3" },
  orText: { textAlign: "center", color: "#666", marginBottom: 6 },

  sectionTitle: {
    fontWeight: "900",
    color: "#333",
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  itemTitle: { fontWeight: "800", color: "#222" },
  itemDetail: { color: "#666" },
  itemComments: { color: "#555", fontStyle: "italic" },
  itemActions: { flexDirection: "row", gap: 6 },
  smallBtn: { padding: 8, borderRadius: 8 },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  label: { fontWeight: "700", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#CFCFCF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    minWidth: 60,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "center",
  },
  timeInput: { width: 64, textAlign: "center", marginHorizontal: 6 },
  amPmGroup: { flexDirection: "row", marginLeft: 8 },
  amPmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  amPmSelected: { backgroundColor: "#4CAF50", borderColor: "#388E3C" },
  amPmUnselected: { backgroundColor: "#FFF", borderColor: "#CCC" },
  amPmText: { fontWeight: "700", color: "#333" },
  amPmTextSelected: { color: "#fff" },

  helper: { color: "#666", fontSize: 12, marginBottom: 8 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default AgendaScreen;