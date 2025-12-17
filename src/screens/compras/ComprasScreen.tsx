// src/screens/compras/ComprasScreen.tsx

import React, { useEffect, useMemo, useState } from "react";
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
  type ProductoCompra,
} from "../../config/localStorageConfig";

// ======================
// Categorías
// ======================
const CATEGORIAS = [
  "Supermercado",
  "Comida",
  "Transporte",
  "Ropa",
  "Salud",
  "Suscripciones",
  "Otros",
];

const ComprasScreen: React.FC = () => {
  // =====================
  // AUTENTICACIÓN
  // =====================
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  // =====================
  // ESTADOS PRINCIPALES
  // =====================
  const [compras, setCompras] = useState<StoredCompra[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);

  // ---- carrito ----
  const [productos, setProductos] = useState<ProductoCompra[]>([]);
  const [prodDesc, setProdDesc] = useState("");
  const [prodCant, setProdCant] = useState("");
  const [prodPrecio, setProdPrecio] = useState("");

  // ---- filtros ----
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  const [saving, setSaving] = useState(false);

  // ============================
  // 1) CARGAR LOCAL PRIMERO
  // ============================
  useEffect(() => {
    (async () => {
      const local = await loadCompras(userId);
      if (local.length) setCompras(local);
    })();
  }, [userId]);

  // ==================================
  // 2) SNAPSHOT FIRESTORE
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
  // HELPERS
  // ======================
  const resetForm = () => {
    setCategoria(CATEGORIAS[0]);
    setProductos([]);
    setProdDesc("");
    setProdCant("");
    setProdPrecio("");
  };

  const persistLocal = async (next: StoredCompra[]) => {
    setCompras(next);
    await saveCompras(userId, next);
  };

  // ======================
  // CARRITO
  // ======================
  const agregarProducto = () => {
    if (!prodDesc || !prodCant || !prodPrecio) {
      Alert.alert("Error", "Completa el producto");
      return;
    }

    const cantidad = Number(prodCant);
    const precio = Number(prodPrecio);

    if (cantidad <= 0 || precio <= 0) {
      Alert.alert("Error", "Cantidad o precio inválidos");
      return;
    }

    const nuevo: ProductoCompra = {
      id: Date.now().toString(),
      descripcion: prodDesc.trim(),
      cantidad,
      precio,
    };

    setProductos((prev) => [...prev, nuevo]);
    setProdDesc("");
    setProdCant("");
    setProdPrecio("");
  };

  const eliminarProducto = (id: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
  };

  const totalCompra = useMemo(
    () => productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0),
    [productos]
  );

  // ======================
  // GUARDAR COMPRA
  // ======================
  const handleGuardarCompra = async () => {
    if (saving) return;

    if (productos.length === 0) {
      Alert.alert("Error", "Agrega al menos un producto");
      return;
    }

    setSaving(true);

    try {
      const nueva: StoredCompra = {
        id: Date.now().toString(),
        categoria,
        productos,
        total: totalCompra,
        fecha: Date.now(),
      };

      const next = [nueva, ...compras];
      await persistLocal(next);

      if (userId) {
        setDoc(doc(db, "users", userId, "compras", nueva.id), nueva, {
          merge: true,
        }).catch(() => {});
      }

      setModalVisible(false);
      resetForm();
      Alert.alert("Compras", "Compra guardada");
    } finally {
      setSaving(false);
    }
  };

  // ======================
  // ELIMINAR COMPRA
  // ======================
  const handleEliminarCompra = (id: string) => {
    Alert.alert("Eliminar", "¿Eliminar esta compra?", [
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
  // FILTROS
  // ======================
  const comprasFiltradas = useMemo(() => {
    return compras.filter((c) => {
      const matchCat =
        filtroCategoria === "Todas" || c.categoria === filtroCategoria;
      const matchBusqueda =
        !busqueda ||
        c.productos.some((p) =>
          p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
        );
      return matchCat && matchBusqueda;
    });
  }, [compras, filtroCategoria, busqueda]);

  const totalGastado = useMemo(
    () => compras.reduce((acc, c) => acc + c.total, 0),
    [compras]
  );

  // ======================
  // RENDER
  // ======================
  const renderCompra = ({ item }: { item: StoredCompra }) => (
    <View style={styles.compraCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.compraCategoria}>{item.categoria}</Text>

        {item.productos.map((p) => (
          <Text key={p.id} style={styles.compraDetalle}>
            • {p.descripcion} ({p.cantidad} × ${p.precio})
          </Text>
        ))}

        <Text style={styles.compraTotal}>Total: ${item.total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity onPress={() => handleEliminarCompra(item.id)}>
        <MaterialIcons name="delete" size={22} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  // ======================
  // UI
  // ======================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="red" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Compras</Text>
        <FontAwesome5 name="shopping-cart" size={24} color="white" />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>Total gastado</Text>
        <Text style={styles.summaryAmount}>${totalGastado.toFixed(2)}</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto..."
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <FlatList
        data={comprasFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderCompra}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView contentContainerStyle={styles.modalContainer}>
              <Text style={styles.modalTitle}>Nueva compra</Text>

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

              <Text style={styles.label}>Producto</Text>

              <TextInput
                style={styles.input}
                placeholder="Descripción"
                placeholderTextColor="#999"
                value={prodDesc}
                onChangeText={setProdDesc}
              />

              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={prodCant}
                onChangeText={setProdCant}
              />

              <TextInput
                style={styles.input}
                placeholder="Precio"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={prodPrecio}
                onChangeText={setProdPrecio}
              />

              <TouchableOpacity
                style={styles.addProductBtn}
                onPress={agregarProducto}
              >
                <Text style={styles.buttonText}>+ Agregar producto</Text>
              </TouchableOpacity>

              {productos.map((p) => (
                <View key={p.id} style={styles.productoRow}>
                  <Text>
                    {p.descripcion} — ${(p.cantidad * p.precio).toFixed(2)}
                  </Text>
                  <TouchableOpacity onPress={() => eliminarProducto(p.id)}>
                    <MaterialIcons name="close" size={18} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={styles.totalText}>
                Total: ${totalCompra.toFixed(2)}
              </Text>

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
                  onPress={handleGuardarCompra}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ComprasScreen;

// ======================
// ESTILOS
// ======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige" },

  header: {
    backgroundColor: "red",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { color: "white", fontSize: 20, fontWeight: "bold" },

  summaryContainer: {
    margin: 16,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: { color: "#777" },
  summaryAmount: {
    fontSize: 26,
    fontWeight: "bold",
    color: "red",
  },

  searchContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  searchInput: { marginLeft: 8, flex: 1 },

  compraCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compraCategoria: { fontWeight: "bold" },
  compraDetalle: { color: "#555", marginTop: 2 },
  compraTotal: {
    marginTop: 6,
    fontWeight: "bold",
    color: "red",
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
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center" },

  label: { marginTop: 10, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    color: "#000",
  },

  pickerContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  pickerOption: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  pickerOptionActive: {
    backgroundColor: "red",
    borderColor: "red",
  },
  pickerOptionText: { color: "#333" },
  pickerOptionTextActive: { color: "white" },

  addProductBtn: {
    marginTop: 10,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  productoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  totalText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
    textAlign: "right",
  },

  modalButtonsRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
});
