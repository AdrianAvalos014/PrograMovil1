// src/screens/tareas/TareasScreen.tsx
// FASE 2 + Offline local (AsyncStorage) + Firestore en tiempo real
// Ajustado para que el modal se cierre aunque no haya conexión.

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

// 🔹 Storage local
import {
  loadTasks,
  saveTasks,
  type StoredTask,
  type Prioridad,
} from "../../config/localStorageConfig";

interface Tarea extends StoredTask {}
type Filtro = "Todas" | "Pendientes" | "Completadas";

const PRIORIDADES: Prioridad[] = ["Baja", "Media", "Alta"];

const TareasScreen: React.FC = () => {
  // ===== Usuario actual =====
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? null);
    });
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

  // ===================== SYNC LOCAL <-> FIRESTORE =====================

  // 1️⃣ Al montar la pantalla: intentar cargar local primero
  useEffect(() => {
    (async () => {
      const localTasks = await loadTasks(userId);
      if (localTasks.length) {
        setTareas(localTasks);
      }
    })();
  }, [userId]);

  // 2️⃣ Suscripción en tiempo real a Firestore cuando haya usuario
  useEffect(() => {
    if (!userId) return;

    const colRef = collection(db, "users", userId, "tasks");

    // Sembrar Firestore con lo local si está vacío (primer login en otro dispo)
    (async () => {
      try {
        const snap = await getDocs(colRef);
        if (snap.empty) {
          const localTasks = await loadTasks(userId);
          for (const t of localTasks) {
            const ref = doc(colRef, String(t.id));
            setDoc(ref, t, { merge: true }).catch((e) =>
              console.log("[tasks] seed setDoc error", e)
            );
          }
        }
      } catch (e) {
        console.log("[tasks] seed from local error", e);
      }
    })();

    const unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        const cloudTasks: Tarea[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          const id =
            typeof data.id === "number" ? data.id : Number(d.id) || Date.now();
          return { ...data, id } as Tarea;
        });

        setTareas(cloudTasks);
        await saveTasks(userId, cloudTasks);
      },
      (error) => {
        console.log("[tasks] onSnapshot error", error);
      }
    );

    return () => unsub();
  }, [userId]);

  // ===== Helpers =====
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

  const persistLocal = async (next: Tarea[]) => {
    setTareas(next);
    await saveTasks(userId, next);
  };

  // ===================== DERIVADOS =====================
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      const matchFiltro =
        filtro === "Todas"
          ? true
          : filtro === "Pendientes"
          ? !t.completada
          : t.completada;

      const term = busqueda.toLowerCase();
      const matchBusqueda =
        !term ||
        t.titulo.toLowerCase().includes(term) ||
        (t.descripcion || "").toLowerCase().includes(term);

      return matchFiltro && matchBusqueda;
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

  // ===================== FORM / MODAL =====================
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

  const abrirModalEditar = (tarea: Tarea) => {
    setEditingTask(tarea);
    setTitulo(tarea.titulo);
    setDescripcion(tarea.descripcion || "");
    setFechaLimite(tarea.fechaLimite || "");
    setPrioridad(tarea.prioridad);
    setModalVisible(true);
  };

  const handleGuardar = async () => {
    if (saving) return; // evita doble click
    if (!titulo.trim()) {
      Alert.alert("Error", "La tarea debe tener un título.");
      return;
    }

    setSaving(true);

    try {
      if (editingTask) {
        // === Editar ===
        const actualizadas = tareas.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                fechaLimite: fechaLimite.trim(),
                prioridad,
              }
            : t
        );
        await persistLocal(actualizadas);

        if (userId) {
          const updated = actualizadas.find((t) => t.id === editingTask.id);
          if (updated) {
            // No hacemos await: no bloquea el cierre del modal
            setDoc(
              doc(db, "users", userId, "tasks", String(updated.id)),
              updated,
              { merge: true }
            ).catch((e) => console.log("[tasks] error setDoc(edit)", e));
          }
        }

        Alert.alert(
          "Tareas",
          "La tarea se actualizó. Si no hay conexión, se sincronizará cuando vuelva el Internet."
        );
      } else {
        // === Nueva ===
        const nueva: Tarea = {
          id: Date.now(),
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fechaLimite: fechaLimite.trim(),
          prioridad,
          completada: false,
        };

        const next = [nueva, ...tareas];
        await persistLocal(next);

        if (userId) {
          setDoc(doc(db, "users", userId, "tasks", String(nueva.id)), nueva, {
            merge: true,
          }).catch((e) => console.log("[tasks] error setDoc(new)", e));
        }

        Alert.alert(
          "Tareas",
          "Tarea guardada. Si no hay conexión, se sincronizará automáticamente cuando haya Internet."
        );
      }

      setModalVisible(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = (id: number) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;

    Alert.alert(
      "Eliminar tarea",
      `¿Seguro que quieres eliminar "${tarea.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const filtradas = tareas.filter((t) => t.id !== id);
            await persistLocal(filtradas);

            if (userId) {
              // No bloqueamos la UI
              deleteDoc(doc(db, "users", userId, "tasks", String(id))).catch(
                (e) => console.log("[tasks] error deleteDoc", e)
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleCompletada = async (id: number) => {
    const actualizadas = tareas.map((t) =>
      t.id === id ? { ...t, completada: !t.completada } : t
    );
    await persistLocal(actualizadas);

    if (userId) {
      const updated = actualizadas.find((t) => t.id === id);
      if (updated) {
        setDoc(doc(db, "users", userId, "tasks", String(updated.id)), updated, {
          merge: true,
        }).catch((e) => console.log("[tasks] error setDoc(toggle)", e));
      }
    }
  };

  // ===================== RENDER =====================
  const renderTarea = ({ item }: { item: Tarea }) => {
    return (
      <View style={styles.taskCard}>
        {/* Checkbox + info */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleToggleCompletada(item.id)}
        >
          <View
            style={[styles.checkbox, item.completada && styles.checkboxChecked]}
          >
            {item.completada && (
              <MaterialIcons name="check" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.taskInfo}>
          <Text
            style={[
              styles.taskTitle,
              item.completada && styles.taskTitleCompleted,
            ]}
          >
            {item.titulo}
          </Text>

          {item.descripcion ? (
            <Text
              style={[
                styles.taskDescription,
                item.completada && styles.taskDescriptionCompleted,
              ]}
              numberOfLines={2}
            >
              {item.descripcion}
            </Text>
          ) : null}

          <View style={styles.taskMetaRow}>
            {item.fechaLimite ? (
              <View style={styles.metaItem}>
                <MaterialIcons
                  name="event"
                  size={14}
                  color="#777"
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.metaText}>{item.fechaLimite}</Text>
              </View>
            ) : null}

            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: prioridadColor(item.prioridad) },
              ]}
            >
              <Text style={styles.priorityText}>{item.prioridad}</Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => abrirModalEditar(item)}
          >
            <MaterialIcons name="edit" size={22} color="#FFB300" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEliminar(item.id)}
          >
            <MaterialIcons name="delete" size={22} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="red" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestión de Tareas</Text>
          <Text style={styles.subtitle}>Organiza tu día como un pro</Text>
        </View>
        <FontAwesome5 name="tasks" size={30} color="white" />
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
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {(["Todas", "Pendientes", "Completadas"] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filtro === f && styles.filterChipActive]}
            onPress={() => setFiltro(f)}
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
      <View style={styles.listContainer}>
        {tareasFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="clipboard-list" size={38} color="#ccc" />
            <Text style={styles.emptyTitle}>Sin tareas aún</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primera tarea con el botón de abajo.
            </Text>
          </View>
        ) : (
          <FlatList
            data={tareasFiltradas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTarea}
            contentContainerStyle={{ paddingBottom: 90 }}
          />
        )}
      </View>

      {/* FAB agregar tarea */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={abrirModalNueva}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Modal Agregar / Editar */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {editingTask ? "Editar tarea" : "Nueva tarea"}
                </Text>

                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Entregar reporte de investigación"
                  value={titulo}
                  onChangeText={setTitulo}
                />

                <Text style={styles.label}>Descripción (opcional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 80, textAlignVertical: "top" },
                  ]}
                  placeholder="Detalles, pasos a seguir, etc."
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                />

                <Text style={styles.label}>Fecha límite (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 30/11/2025"
                  value={fechaLimite}
                  onChangeText={setFechaLimite}
                />

                <Text style={styles.label}>Prioridad</Text>
                <View style={styles.priorityRow}>
                  {PRIORIDADES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityChip,
                        prioridad === p && {
                          backgroundColor: prioridadColor(p),
                          borderColor: prioridadColor(p),
                        },
                      ]}
                      onPress={() => setPrioridad(p)}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          prioridad === p && { color: "white" },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#F44336" }]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
                    onPress={handleGuardar}
                    disabled={saving}
                  >
                    <Text style={styles.buttonText}>
                      {editingTask ? "Guardar cambios" : "Guardar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ===== Estilos (como tu FASE 2) =====
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
  title: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
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
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "white",
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: FONT_SIZES.medium,
    color: "#333",
  },

  filtersContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
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

  listContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },

  taskCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  checkboxContainer: {
    paddingRight: 8,
    justifyContent: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "red",
  },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: "#333",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  taskDescription: {
    marginTop: 2,
    fontSize: FONT_SIZES.small,
    color: "#666",
  },
  taskDescriptionCompleted: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  metaText: {
    fontSize: FONT_SIZES.small,
    color: "#777",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: FONT_SIZES.small,
    color: "white",
    fontWeight: "bold",
  },

  taskActions: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  iconButton: { padding: 4 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: "#555",
  },
  emptySubtitle: {
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

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZES.small,
    marginBottom: 6,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: FONT_SIZES.medium,
    backgroundColor: "white",
  },
  priorityRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    backgroundColor: "white",
  },
  priorityChipText: {
    fontSize: FONT_SIZES.small,
    color: "#555",
  },

  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  buttonText: {
    color: "white",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
});

export default TareasScreen;
