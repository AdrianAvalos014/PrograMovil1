import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

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
  loadCompras,
  saveCompras,
  type StoredCompra,
} from "../../config/localStorageConfig";

// Categorías
const CATEGORIAS = [
  "Supermercado",
  "Comida",
  "Transporte",
  "Ropa",
  "Salud",
  "Suscripciones",
  "Otros",
];

const ComprasScreen = () => {
  // =====================
  //  AUTENTICACIÓN
  // =====================
  const [userId, setUserId] = useState(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  // =====================
  //  Estados
  // =====================
  const [compras, setCompras] = useState<StoredCompra[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [editingCompra, setEditingCompra] = useState<StoredCompra | null>(null);

  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  const [saving, setSaving] = useState(false);

  // ============================
  // 1) CARGAR LOCAL STORAGE PRIMERO
  // ============================
  useEffect(() => {
    (async () => {
      const local = await loadCompras(userId);
      if (local.length) setCompras(local);
    })();
  }, [userId]);

  // ==================================
  // 2) SNAPSHOT FIRESTORE (tiempo real)
  // ==================================
  useEffect(() => {
    if (!userId) return;

    const colRef = collection(db, "users", userId, "compras");

    (async () => {
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const local = await loadCompras(userId);
        for (const c of local) {
          setDoc(doc(colRef, c.id), c, { merge: true }).catch(() => {});
        }
      }
    })();

    const unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        const cloud: StoredCompra[] = snapshot.docs.map((d) => ({
          ...(d.data() as StoredCompra),
          id: d.id,
        }));

        setCompras(cloud);
        await saveCompras(userId, cloud);
      },
      (err) => console.log("[compras] snapshot err:", err)
    );

    return () => unsub();
  }, [userId]);

  // ======================
  // Funciones auxiliares
  // ======================
  const resetForm = () => {
    setCategoria(CATEGORIAS[0]);
    setDescripcion("");
    setCantidad("");
    setPrecio("");
    setEditingCompra(null);
  };

  const persistLocal = async (next: StoredCompra[]) => {
    setCompras(next);
    await saveCompras(userId, next);
  };
  // ======================
  // Abrir modal
  // ======================
  const abrirModalNueva = () => {
    resetForm();
    setModalVisible(true);
  };

  const abrirModalEditar = (compra: StoredCompra) => {
    setEditingCompra(compra);
    setCategoria(compra.categoria);
    setDescripcion(compra.descripcion);
    setCantidad(String(compra.cantidad));
    setPrecio(String(compra.precio));
    setModalVisible(true);
  };

  // ======================
  // GUARDAR / EDITAR
  // ======================
  const handleGuardar = async () => {
    if (saving) return;

    if (!descripcion.trim() || !cantidad.trim() || !precio.trim()) {
      return Alert.alert("Error", "Completa todos los campos.");
    }

    const cantNum = parseInt(cantidad, 10);
    const precioNum = parseFloat(precio);

    if (isNaN(cantNum) || isNaN(precioNum) || cantNum <= 0 || precioNum <= 0) {
      return Alert.alert("Error", "Cantidad / precio inválidos.");
    }

    setSaving(true);

    try {
      if (editingCompra) {
        // EDITAR
        const updated: StoredCompra = {
          ...editingCompra,
          categoria,
          descripcion: descripcion.trim(),
          cantidad: cantNum,
          precio: precioNum,
        };

        const next = compras.map((c) =>
          c.id === editingCompra.id ? updated : c
        );

        await persistLocal(next);

        if (userId) {
          setDoc(doc(db, "users", userId, "compras", updated.id), updated, {
            merge: true,
          }).catch(() => {});
        }

        Alert.alert("Compras", "Compra actualizada.");
      } else {
        // NUEVA
        const nueva: StoredCompra = {
          id: Date.now().toString(),
          categoria,
          descripcion: descripcion.trim(),
          cantidad: cantNum,
          precio: precioNum,
        };

        const next = [nueva, ...compras];
        await persistLocal(next);

        if (userId) {
          setDoc(doc(db, "users", userId, "compras", nueva.id), nueva, {
            merge: true,
          }).catch(() => {});
        }

        Alert.alert("Compras", "Compra agregada.");
      }

      setModalVisible(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  // ======================
  // ELIMINAR
  // ======================
  const handleEliminar = (id: string) => {
    const compra = compras.find((c) => c.id === id);
    if (!compra) return;

    Alert.alert("Eliminar compra", `¿Eliminar "${compra.descripcion}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const next = compras.filter((c) => c.id !== id);
          await persistLocal(next);

          if (userId) {
            deleteDoc(doc(db, "users", userId, "compras", id)).catch(() => {});
          }
        },
      },
    ]);
  };

  // ======================
  // Filtros
  // ======================
  const comprasFiltradas = useMemo(() => {
    return compras.filter((c) => {
      const matchCategoria =
        filtroCategoria === "Todas" || c.categoria === filtroCategoria;
      const matchBusqueda = c.descripcion
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      return matchCategoria && matchBusqueda;
    });
  }, [compras, filtroCategoria, busqueda]);

  const totalGastado = useMemo(
    () => compras.reduce((acc, c) => acc + c.cantidad * c.precio, 0),
    [compras]
  );

  // ======================
  // Render item
  // ======================
  const renderCompra = ({ item }: { item: StoredCompra }) => {
    const totalLinea = item.cantidad * item.precio;

    return (
      <View style={styles.compraCard}>
        <View style={styles.compraInfo}>
          <Text style={styles.compraDescripcion}>{item.descripcion}</Text>
          <Text style={styles.compraCategoria}>{item.categoria}</Text>
          <Text style={styles.compraDetalle}>
            Cant: {item.cantidad} · ${item.precio.toFixed(2)}
          </Text>
          <Text style={styles.compraTotal}>
            Total: ${totalLinea.toFixed(2)}
          </Text>
        </View>

        <View style={styles.compraActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => abrirModalEditar(item)}
          >
            <MaterialIcons name="edit" size={22} color="#FF9800" />
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

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gestión de Compras</Text>
          <Text style={styles.subTitle}>Control de gastos</Text>
        </View>
        <FontAwesome5 name="shopping-bag" size={30} color="white" />
      </View>

      {/* RESUMEN */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Total gastado</Text>
        <Text style={styles.summaryAmount}>${totalGastado.toFixed(2)}</Text>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* FILTROS */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filtroCategoria === "Todas" && styles.filterChipActive,
          ]}
          onPress={() => setFiltroCategoria("Todas")}
        >
          <Text
            style={[
              styles.filterChipText,
              filtroCategoria === "Todas" && styles.filterChipTextActive,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>

        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              filtroCategoria === cat && styles.filterChipActive,
            ]}
            onPress={() => setFiltroCategoria(cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                filtroCategoria === cat && styles.filterChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA */}
      <View style={styles.listContainer}>
        {comprasFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="list-alt" size={40} color="#ccc" />
            <Text style={styles.emptyTitle}>Sin compras registradas</Text>
          </View>
        ) : (
          <FlatList
            data={comprasFiltradas}
            keyExtractor={(item) => item.id}
            renderItem={renderCompra}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={abrirModalNueva}>
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {editingCompra ? "Editar compra" : "Registrar compra"}
                </Text>

                <Text style={styles.label}>Categoría</Text>
                <View style={styles.pickerContainer}>
                  {CATEGORIAS.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.pickerOption,
                        categoria === cat && styles.pickerOptionActive,
                      ]}
                      onPress={() => setCategoria(cat)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          categoria === cat && styles.pickerOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={styles.input}
                  value={descripcion}
                  onChangeText={setDescripcion}
                />

                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Precio</Text>
                <TextInput
                  style={styles.input}
                  value={precio}
                  onChangeText={setPrecio}
                  keyboardType="numeric"
                />

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
                  >
                    <Text style={styles.buttonText}>
                      {editingCompra ? "Guardar" : "Registrar"}
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

export default ComprasScreen;

// =========================
// ESTILOS (los mismos que ya tenías)
// =========================
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
  title: { fontSize: 22, fontWeight: "bold", color: "white" },
  subTitle: { fontSize: 14, color: "#f5f5f5" },

  summaryContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "white",
    elevation: 3,
  },
  summaryLabel: { color: "#777" },
  summaryAmount: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "bold",
    color: "red",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "white",
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#333" },

  filtersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "white",
  },
  filterChipActive: { backgroundColor: "red", borderColor: "red" },
  filterChipText: { color: "#555" },
  filterChipTextActive: { color: "white", fontWeight: "bold" },

  listContainer: { flex: 1, marginTop: 8, marginHorizontal: 16 },

  compraCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "white",
    marginBottom: 10,
    elevation: 2,
  },
  compraInfo: { flex: 1 },
  compraDescripcion: { fontSize: 16, fontWeight: "600", color: "#333" },
  compraCategoria: { fontSize: 13, color: "#888", marginTop: 2 },
  compraDetalle: { color: "#555", marginTop: 4 },
  compraTotal: { color: "red", fontWeight: "bold", marginTop: 4 },

  compraActions: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  iconButton: { padding: 4 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  emptyTitle: { marginTop: 10, fontSize: 16, color: "#555" },

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
  modalScrollContent: { flexGrow: 1, justifyContent: "center" },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center" },

  label: { fontWeight: "bold", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },

  pickerContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  pickerOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderColor: "#BDBDBD",
  },
  pickerOptionActive: { backgroundColor: "red", borderColor: "red" },
  pickerOptionText: { color: "#333" },
  pickerOptionTextActive: { color: "white", fontWeight: "bold" },

  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: { color: "white", fontWeight: "bold" },
});