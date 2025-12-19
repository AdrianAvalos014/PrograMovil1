// // src/screens/compras/ComprasScreen.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   Modal,
//   TextInput,
//   Alert,
//   FlatList,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";

// import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

// import { auth, db } from "../../services/firebase-config";
// import {
//   collection,
//   doc,
//   onSnapshot,
//   setDoc,
//   deleteDoc,
//   getDocs,
// } from "firebase/firestore";

// import {
//   loadCompras,
//   saveCompras,
//   type StoredCompra,
//   type ProductoCompra,
// } from "../../config/localStorageConfig";

// // ======================
// // Categorías
// // ======================
// const CATEGORIAS = [
//   "Supermercado",
//   "Comida",
//   "Transporte",
//   "Ropa",
//   "Salud",
//   "Suscripciones",
//   "Otros",
// ];

// const ComprasScreen: React.FC = () => {
//   // =====================
//   // AUTENTICACIÓN
//   // =====================
//   const [userId, setUserId] = useState<string | null>(
//     auth.currentUser?.uid ?? null
//   );

//   useEffect(() => {
//     const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
//     return unsub;
//   }, []);

//   // =====================
//   // ESTADOS PRINCIPALES
//   // =====================
//   const [compras, setCompras] = useState<StoredCompra[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);

//   const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);

//   // ---- carrito ----
//   const [productos, setProductos] = useState<ProductoCompra[]>([]);
//   const [prodDesc, setProdDesc] = useState("");
//   const [prodCant, setProdCant] = useState("");
//   const [prodPrecio, setProdPrecio] = useState("");

//   // ---- filtros ----
//   const [filtroCategoria, setFiltroCategoria] = useState("Todas");
//   const [busqueda, setBusqueda] = useState("");

//   const [saving, setSaving] = useState(false);

//   // ============================
//   // 1) CARGAR LOCAL PRIMERO
//   // ============================
//   useEffect(() => {
//     (async () => {
//       const local = await loadCompras(userId);
//       if (local.length) setCompras(local);
//     })();
//   }, [userId]);

//   // ==================================
//   // 2) SNAPSHOT FIRESTORE
//   // ==================================
//   useEffect(() => {
//     if (!userId) return;

//     const colRef = collection(db, "users", userId, "compras");

//     (async () => {
//       const snap = await getDocs(colRef);
//       if (snap.empty) {
//         const local = await loadCompras(userId);
//         for (const c of local) {
//           setDoc(doc(colRef, c.id), c, { merge: true }).catch(() => {});
//         }
//       }
//     })();

//     const unsub = onSnapshot(
//       colRef,
//       async (snapshot) => {
//         const cloud: StoredCompra[] = snapshot.docs.map((d) => ({
//           ...(d.data() as StoredCompra),
//           id: d.id,
//         }));
//         setCompras(cloud);
//         await saveCompras(userId, cloud);
//       },
//       (err) => console.log("[compras] snapshot err:", err)
//     );

//     return () => unsub();
//   }, [userId]);

//   // ======================
//   // HELPERS
//   // ======================
//   const resetForm = () => {
//     setCategoria(CATEGORIAS[0]);
//     setProductos([]);
//     setProdDesc("");
//     setProdCant("");
//     setProdPrecio("");
//   };

//   const persistLocal = async (next: StoredCompra[]) => {
//     setCompras(next);
//     await saveCompras(userId, next);
//   };

//   // ======================
//   // CARRITO
//   // ======================
//   const agregarProducto = () => {
//     if (!prodDesc || !prodCant || !prodPrecio) {
//       Alert.alert("Error", "Completa el producto");
//       return;
//     }

//     const cantidad = Number(prodCant);
//     const precio = Number(prodPrecio);

//     if (cantidad <= 0 || precio <= 0) {
//       Alert.alert("Error", "Cantidad o precio inválidos");
//       return;
//     }

//     const nuevo: ProductoCompra = {
//       id: Date.now().toString(),
//       descripcion: prodDesc.trim(),
//       cantidad,
//       precio,
//     };

//     setProductos((prev) => [...prev, nuevo]);
//     setProdDesc("");
//     setProdCant("");
//     setProdPrecio("");
//   };

//   const eliminarProducto = (id: string) => {
//     setProductos((prev) => prev.filter((p) => p.id !== id));
//   };

//   const totalCompra = useMemo(
//     () => productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0),
//     [productos]
//   );

//   // ======================
//   // GUARDAR COMPRA
//   // ======================
//   const handleGuardarCompra = async () => {
//     if (saving) return;

//     if (productos.length === 0) {
//       Alert.alert("Error", "Agrega al menos un producto");
//       return;
//     }

//     setSaving(true);

//     try {
//       const nueva: StoredCompra = {
//         id: Date.now().toString(),
//         categoria,
//         productos,
//         total: totalCompra,
//         fecha: Date.now(),
//       };

//       const next = [nueva, ...compras];
//       await persistLocal(next);

//       if (userId) {
//         setDoc(doc(db, "users", userId, "compras", nueva.id), nueva, {
//           merge: true,
//         }).catch(() => {});
//       }

//       setModalVisible(false);
//       resetForm();
//       Alert.alert("Compras", "Compra guardada");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ======================
//   // ELIMINAR COMPRA
//   // ======================
//   const handleEliminarCompra = (id: string) => {
//     Alert.alert("Eliminar", "¿Eliminar esta compra?", [
//       { text: "Cancelar", style: "cancel" },
//       {
//         text: "Eliminar",
//         style: "destructive",
//         onPress: async () => {
//           const next = compras.filter((c) => c.id !== id);
//           await persistLocal(next);
//           if (userId) {
//             deleteDoc(doc(db, "users", userId, "compras", id)).catch(() => {});
//           }
//         },
//       },
//     ]);
//   };

//   // ======================
//   // FILTROS
//   // ======================
//   const comprasFiltradas = useMemo(() => {
//     return compras.filter((c) => {
//       const matchCat =
//         filtroCategoria === "Todas" || c.categoria === filtroCategoria;
//       const matchBusqueda =
//         !busqueda ||
//         c.productos.some((p) =>
//           p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
//         );
//       return matchCat && matchBusqueda;
//     });
//   }, [compras, filtroCategoria, busqueda]);

//   const totalGastado = useMemo(
//     () => compras.reduce((acc, c) => acc + c.total, 0),
//     [compras]
//   );

//   // ======================
//   // RENDER
//   // ======================
//   const renderCompra = ({ item }: { item: StoredCompra }) => (
//     <View style={styles.compraCard}>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.compraCategoria}>{item.categoria}</Text>

//         {item.productos.map((p) => (
//           <Text key={p.id} style={styles.compraDetalle}>
//             • {p.descripcion} ({p.cantidad} × ${p.precio})
//           </Text>
//         ))}

//         <Text style={styles.compraTotal}>Total: ${item.total.toFixed(2)}</Text>
//       </View>

//       <TouchableOpacity onPress={() => handleEliminarCompra(item.id)}>
//         <MaterialIcons name="delete" size={22} color="#F44336" />
//       </TouchableOpacity>
//     </View>
//   );

//   // ======================
//   // UI
//   // ======================
//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="red" barStyle="light-content" />

//       <View style={styles.header}>
//         <Text style={styles.title}>¡Registras tus compras!</Text>
//         <FontAwesome5 name="shopping-cart" size={24} color="white" />
//       </View>

//       <View style={styles.summaryContainer}>
//         <Text style={styles.summaryLabel}>Total gastado</Text>
//         <Text style={styles.summaryAmount}>${totalGastado.toFixed(2)}</Text>
//       </View>

//       <View style={styles.searchContainer}>
//         <MaterialIcons name="search" size={20} color="#777" />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Buscar producto..."
//           value={busqueda}
//           onChangeText={setBusqueda}
//         />
//       </View>

//       <FlatList
//         data={comprasFiltradas}
//         keyExtractor={(item) => item.id}
//         renderItem={renderCompra}
//         contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
//       />

//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => setModalVisible(true)}
//       >
//         <MaterialIcons name="add" size={30} color="white" />
//       </TouchableOpacity>

//       {/* MODAL */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View style={styles.modalBackground}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === "ios" ? "padding" : undefined}
//           >
//             <ScrollView contentContainerStyle={styles.modalContainer}>
//               <Text style={styles.modalTitle}>Nueva compra</Text>

//               <Text style={styles.label}>Categoría</Text>
//               <View style={styles.pickerContainer}>
//                 {CATEGORIAS.map((cat) => (
//                   <TouchableOpacity
//                     key={cat}
//                     style={[
//                       styles.pickerOption,
//                       categoria === cat && styles.pickerOptionActive,
//                     ]}
//                     onPress={() => setCategoria(cat)}
//                   >
//                     <Text
//                       style={[
//                         styles.pickerOptionText,
//                         categoria === cat && styles.pickerOptionTextActive,
//                       ]}
//                     >
//                       {cat}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>

//               <Text style={styles.label}>Producto</Text>

//               <TextInput
//                 style={styles.input}
//                 placeholder="Descripción"
//                 placeholderTextColor="#999"
//                 value={prodDesc}
//                 onChangeText={setProdDesc}
//               />

//               <TextInput
//                 style={styles.input}
//                 placeholder="Cantidad"
//                 placeholderTextColor="#999"
//                 keyboardType="numeric"
//                 value={prodCant}
//                 onChangeText={setProdCant}
//               />

//               <TextInput
//                 style={styles.input}
//                 placeholder="Precio"
//                 placeholderTextColor="#999"
//                 keyboardType="numeric"
//                 value={prodPrecio}
//                 onChangeText={setProdPrecio}
//               />

//               <TouchableOpacity
//                 style={styles.addProductBtn}
//                 onPress={agregarProducto}
//               >
//                 <Text style={styles.buttonText}>+ Agregar producto</Text>
//               </TouchableOpacity>

//               {productos.map((p) => (
//                 <View key={p.id} style={styles.productoRow}>
//                   <Text>
//                     {p.descripcion} — ${(p.cantidad * p.precio).toFixed(2)}
//                   </Text>
//                   <TouchableOpacity onPress={() => eliminarProducto(p.id)}>
//                     <MaterialIcons name="close" size={18} color="#F44336" />
//                   </TouchableOpacity>
//                 </View>
//               ))}

//               <Text style={styles.totalText}>
//                 Total: ${totalCompra.toFixed(2)}
//               </Text>

//               <View style={styles.modalButtonsRow}>
//                 <TouchableOpacity
//                   style={[styles.modalButton, { backgroundColor: "#F44336" }]}
//                   onPress={() => {
//                     setModalVisible(false);
//                     resetForm();
//                   }}
//                 >
//                   <Text style={styles.buttonText}>Cancelar</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
//                   onPress={handleGuardarCompra}
//                 >
//                   <Text style={styles.buttonText}>Guardar</Text>
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           </KeyboardAvoidingView>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default ComprasScreen;

// // ======================
// // ESTILOS
// // ======================
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "beige" },

//   header: {
//     backgroundColor: "red",
//     padding: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   title: { color: "white", fontSize: 20, fontWeight: "bold" },

//   summaryContainer: {
//     margin: 16,
//     backgroundColor: "white",
//     padding: 16,
//     borderRadius: 12,
//   },
//   summaryLabel: { color: "#777" },
//   summaryAmount: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "red",
//   },

//   searchContainer: {
//     flexDirection: "row",
//     marginHorizontal: 16,
//     backgroundColor: "white",
//     padding: 10,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   searchInput: { marginLeft: 8, flex: 1 },

//   compraCard: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 10,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   compraCategoria: { fontWeight: "bold" },
//   compraDetalle: { color: "#555", marginTop: 2 },
//   compraTotal: {
//     marginTop: 6,
//     fontWeight: "bold",
//     color: "red",
//   },

//   fab: {
//     position: "absolute",
//     right: 20,
//     bottom: 30,
//     width: 58,
//     height: 58,
//     borderRadius: 29,
//     backgroundColor: "red",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   modalBackground: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//   },
//   modalContainer: {
//     backgroundColor: "white",
//     margin: 20,
//     borderRadius: 12,
//     padding: 20,
//   },
//   modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center" },

//   label: { marginTop: 10, fontWeight: "bold" },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 8,
//     marginTop: 6,
//     color: "#000",
//   },

//   pickerContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
//   pickerOption: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 6,
//     borderRadius: 8,
//     marginRight: 6,
//     marginBottom: 6,
//   },
//   pickerOptionActive: {
//     backgroundColor: "red",
//     borderColor: "red",
//   },
//   pickerOptionText: { color: "#333" },
//   pickerOptionTextActive: { color: "white" },

//   addProductBtn: {
//     marginTop: 10,
//     backgroundColor: "#2196F3",
//     padding: 10,
//     borderRadius: 8,
//     alignItems: "center",
//   },

//   productoRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 6,
//   },

//   totalText: {
//     marginTop: 10,
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "red",
//     textAlign: "right",
//   },

//   modalButtonsRow: {
//     flexDirection: "row",
//     marginTop: 20,
//   },
//   modalButton: {
//     flex: 1,
//     marginHorizontal: 5,
//     padding: 12,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   buttonText: { color: "white", fontWeight: "bold" },
// });

// src/screens/compras/ComprasScreen.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   Modal,
//   TextInput,
//   Alert,
//   FlatList,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";

// import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

// import { auth, db } from "../../services/firebase-config";
// import {
//   collection,
//   doc,
//   onSnapshot,
//   setDoc,
//   deleteDoc,
//   getDocs,
// } from "firebase/firestore";

// import {
//   loadCompras,
//   saveCompras,
//   type StoredCompra,
//   type ProductoCompra,
// } from "../../config/localStorageConfig";

// // ======================
// // Categorías
// // ======================
// const CATEGORIAS = [
//   "Supermercado",
//   "Comida",
//   "Transporte",
//   "Ropa",
//   "Salud",
//   "Suscripciones",
//   "Otros",
// ];

// // ======================
// // Helpers calendario
// // ======================
// const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
// const toISO = (d: Date) =>
//   `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// const fromISOtoDMY = (iso: string) => {
//   const [y, m, d] = iso.split("-");
//   return `${d}/${m}/${y}`;
// };
// const todayISO = () => toISO(new Date());

// const monthMatrix = (year: number, month0: number) => {
//   const first = new Date(year, month0, 1);
//   const startDow = (first.getDay() + 6) % 7;
//   const daysInMonth = new Date(year, month0 + 1, 0).getDate();

//   const cells: (Date | null)[] = [];
//   for (let i = 0; i < startDow; i++) cells.push(null);
//   for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month0, d));
//   while (cells.length < 42) cells.push(null);

//   const rows: (Date | null)[][] = [];
//   for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
//   return rows;
// };

// const MONTHS = [
//   "Enero",
//   "Febrero",
//   "Marzo",
//   "Abril",
//   "Mayo",
//   "Junio",
//   "Julio",
//   "Agosto",
//   "Septiembre",
//   "Octubre",
//   "Noviembre",
//   "Diciembre",
// ];

// // ======================
// // Pantalla
// // ======================
// const ComprasScreen: React.FC = () => {
//   // =====================
//   // AUTENTICACIÓN
//   // =====================
//   const [userId, setUserId] = useState<string | null>(
//     auth.currentUser?.uid ?? null
//   );

//   useEffect(() => {
//     const unsub = auth.onAuthStateChanged((u) => setUserId(u?.uid ?? null));
//     return unsub;
//   }, []);

//   // =====================
//   // ESTADOS
//   // =====================
//   const [compras, setCompras] = useState<StoredCompra[]>([]);
//   const [modalVisible, setModalVisible] = useState(false);

//   const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);

//   // ---- fecha ----
//   const [fecha, setFecha] = useState<string>("");
//   const [calendarVisible, setCalendarVisible] = useState(false);
//   const [tempDateISO, setTempDateISO] = useState(todayISO());
//   const [calYear, setCalYear] = useState(new Date().getFullYear());
//   const [calMonth0, setCalMonth0] = useState(new Date().getMonth());
//   const calRows = useMemo(
//     () => monthMatrix(calYear, calMonth0),
//     [calYear, calMonth0]
//   );

//   // ---- carrito ----
//   const [productos, setProductos] = useState<ProductoCompra[]>([]);
//   const [prodDesc, setProdDesc] = useState("");
//   const [prodCant, setProdCant] = useState("");
//   const [prodPrecio, setProdPrecio] = useState("");

//   // ---- filtros ----
//   const [filtroCategoria, setFiltroCategoria] = useState("Todas");
//   const [busqueda, setBusqueda] = useState("");

//   const [saving, setSaving] = useState(false);

//   // ============================
//   // LOAD LOCAL
//   // ============================
//   useEffect(() => {
//     (async () => {
//       const local = await loadCompras(userId);
//       if (local.length) setCompras(local);
//     })();
//   }, [userId]);

//   // ============================
//   // FIRESTORE
//   // ============================
//   useEffect(() => {
//     if (!userId) return;

//     const colRef = collection(db, "users", userId, "compras");

//     (async () => {
//       const snap = await getDocs(colRef);
//       if (snap.empty) {
//         const local = await loadCompras(userId);
//         for (const c of local) {
//           setDoc(doc(colRef, c.id), c, { merge: true }).catch(() => {});
//         }
//       }
//     })();

//     const unsub = onSnapshot(colRef, async (snapshot) => {
//       const cloud: StoredCompra[] = snapshot.docs.map((d) => ({
//         ...(d.data() as StoredCompra),
//         id: d.id,
//       }));
//       setCompras(cloud);
//       await saveCompras(userId, cloud);
//     });

//     return () => unsub();
//   }, [userId]);

//   // ======================
//   // HELPERS
//   // ======================
//   const resetForm = () => {
//     setCategoria(CATEGORIAS[0]);
//     setProductos([]);
//     setProdDesc("");
//     setProdCant("");
//     setProdPrecio("");
//     setFecha("");
//   };

//   const persistLocal = async (next: StoredCompra[]) => {
//     setCompras(next);
//     await saveCompras(userId, next);
//   };

//   // ======================
//   // CARRITO
//   // ======================
//   const agregarProducto = () => {
//     if (!prodDesc || !prodCant || !prodPrecio) {
//       Alert.alert("Error", "Completa el producto");
//       return;
//     }

//     const cantidad = Number(prodCant);
//     const precio = Number(prodPrecio);

//     if (cantidad <= 0 || precio <= 0) {
//       Alert.alert("Error", "Cantidad o precio inválidos");
//       return;
//     }

//     setProductos((prev) => [
//       ...prev,
//       {
//         id: Date.now().toString(),
//         descripcion: prodDesc.trim(),
//         cantidad,
//         precio,
//       },
//     ]);

//     setProdDesc("");
//     setProdCant("");
//     setProdPrecio("");
//   };

//   const eliminarProducto = (id: string) => {
//     setProductos((prev) => prev.filter((p) => p.id !== id));
//   };

//   const totalCompra = useMemo(
//     () => productos.reduce((acc, p) => acc + p.cantidad * p.precio, 0),
//     [productos]
//   );

//   // ======================
//   // GUARDAR
//   // ======================
//   const handleGuardarCompra = async () => {
//     if (saving) return;

//     if (!fecha) {
//       Alert.alert("Error", "Selecciona una fecha");
//       return;
//     }

//     if (productos.length === 0) {
//       Alert.alert("Error", "Agrega al menos un producto");
//       return;
//     }

//     setSaving(true);
//     try {
//       const nueva: StoredCompra = {
//         id: Date.now().toString(),
//         categoria,
//         productos,
//         total: totalCompra,
//         fecha: new Date(
//           fecha.split("/").reverse().join("-")
//         ).getTime(),
//       };

//       const next = [nueva, ...compras];
//       await persistLocal(next);

//       if (userId) {
//         setDoc(doc(db, "users", userId, "compras", nueva.id), nueva, {
//           merge: true,
//         }).catch(() => {});
//       }

//       setModalVisible(false);
//       resetForm();
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ======================
//   // FILTROS
//   // ======================
//   const comprasFiltradas = useMemo(() => {
//     return compras.filter((c) => {
//       const matchCat =
//         filtroCategoria === "Todas" || c.categoria === filtroCategoria;
//       const matchBusqueda =
//         !busqueda ||
//         c.productos.some((p) =>
//           p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
//         );
//       return matchCat && matchBusqueda;
//     });
//   }, [compras, filtroCategoria, busqueda]);

//   const totalGastado = useMemo(
//     () => compras.reduce((acc, c) => acc + c.total, 0),
//     [compras]
//   );

//   // ======================
//   // RENDER
//   // ======================
//   const renderCompra = ({ item }: { item: StoredCompra }) => (
//     <View style={styles.compraCard}>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.compraCategoria}>{item.categoria}</Text>
//         <Text style={styles.compraFecha}>
//           {new Date(item.fecha).toLocaleDateString()}
//         </Text>

//         {item.productos.map((p) => (
//           <Text key={p.id} style={styles.compraDetalle}>
//             • {p.descripcion} ({p.cantidad} × ${p.precio})
//           </Text>
//         ))}

//         <Text style={styles.compraTotal}>Total: ${item.total.toFixed(2)}</Text>
//       </View>

//       <TouchableOpacity onPress={() => handleEliminarCompra(item.id)}>
//         <MaterialIcons name="delete" size={22} color="#F44336" />
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="red" barStyle="light-content" />

//       <View style={styles.header}>
//         <Text style={styles.title}>Compras</Text>
//         <FontAwesome5 name="shopping-cart" size={24} color="white" />
//       </View>

//       <View style={styles.summaryContainer}>
//         <Text style={styles.summaryLabel}>Total gastado</Text>
//         <Text style={styles.summaryAmount}>${totalGastado.toFixed(2)}</Text>
//       </View>

//       <View style={styles.searchContainer}>
//         <MaterialIcons name="search" size={20} color="#777" />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Buscar producto..."
//           value={busqueda}
//           onChangeText={setBusqueda}
//         />
//       </View>

//       <FlatList
//         data={comprasFiltradas}
//         keyExtractor={(item) => item.id}
//         renderItem={renderCompra}
//         contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
//       />

//       <TouchableOpacity
//         style={styles.fab}
//         onPress={() => setModalVisible(true)}
//       >
//         <MaterialIcons name="add" size={30} color="white" />
//       </TouchableOpacity>

//       {/* MODAL COMPRA */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//         <View style={styles.modalBackground}>
//           <KeyboardAvoidingView
//             behavior={Platform.OS === "ios" ? "padding" : undefined}
//           >
//             <ScrollView contentContainerStyle={styles.modalContainer}>
//               <Text style={styles.modalTitle}>Nueva compra</Text>

//               <Text style={styles.label}>Fecha *</Text>
//               <TouchableOpacity
//                 style={styles.dateBtn}
//                 onPress={() => setCalendarVisible(true)}
//               >
//                 <MaterialIcons name="event" size={18} color="#555" />
//                 <Text style={styles.dateText}>
//                   {fecha || "Seleccionar fecha"}
//                 </Text>
//               </TouchableOpacity>

//               <Text style={styles.label}>Categoría</Text>
//               <View style={styles.pickerContainer}>
//                 {CATEGORIAS.map((cat) => (
//                   <TouchableOpacity
//                     key={cat}
//                     style={[
//                       styles.pickerOption,
//                       categoria === cat && styles.pickerOptionActive,
//                     ]}
//                     onPress={() => setCategoria(cat)}
//                   >
//                     <Text
//                       style={[
//                         styles.pickerOptionText,
//                         categoria === cat && styles.pickerOptionTextActive,
//                       ]}
//                     >
//                       {cat}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>

//               <Text style={styles.label}>Producto</Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Descripción"
//                 value={prodDesc}
//                 onChangeText={setProdDesc}
//               />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Cantidad"
//                 keyboardType="numeric"
//                 value={prodCant}
//                 onChangeText={setProdCant}
//               />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Precio"
//                 keyboardType="numeric"
//                 value={prodPrecio}
//                 onChangeText={setProdPrecio}
//               />

//               <TouchableOpacity
//                 style={styles.addProductBtn}
//                 onPress={agregarProducto}
//               >
//                 <Text style={styles.buttonText}>+ Agregar producto</Text>
//               </TouchableOpacity>

//               {productos.map((p) => (
//                 <View key={p.id} style={styles.productoRow}>
//                   <Text>
//                     {p.descripcion} — ${(p.cantidad * p.precio).toFixed(2)}
//                   </Text>
//                   <TouchableOpacity onPress={() => eliminarProducto(p.id)}>
//                     <MaterialIcons name="close" size={18} color="#F44336" />
//                   </TouchableOpacity>
//                 </View>
//               ))}

//               <Text style={styles.totalText}>
//                 Total: ${totalCompra.toFixed(2)}
//               </Text>

//               <View style={styles.modalButtonsRow}>
//                 <TouchableOpacity
//                   style={[styles.modalButton, { backgroundColor: "#F44336" }]}
//                   onPress={() => {
//                     setModalVisible(false);
//                     resetForm();
//                   }}
//                 >
//                   <Text style={styles.buttonText}>Cancelar</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
//                   onPress={handleGuardarCompra}
//                 >
//                   <Text style={styles.buttonText}>Guardar</Text>
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           </KeyboardAvoidingView>
//         </View>
//       </Modal>

//       {/* MODAL CALENDARIO */}
//       <Modal transparent visible={calendarVisible} animationType="slide">
//         <View style={styles.modalBackground}>
//           <View style={styles.calendarCard}>
//             <View style={styles.calHeader}>
//               <TouchableOpacity
//                 onPress={() => {
//                   const d = new Date(calYear, calMonth0 - 1, 1);
//                   setCalYear(d.getFullYear());
//                   setCalMonth0(d.getMonth());
//                 }}
//               >
//                 <FontAwesome5 name="chevron-left" />
//               </TouchableOpacity>
//               <Text style={styles.calTitle}>
//                 {MONTHS[calMonth0]} {calYear}
//               </Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   const d = new Date(calYear, calMonth0 + 1, 1);
//                   setCalYear(d.getFullYear());
//                   setCalMonth0(d.getMonth());
//                 }}
//               >
//                 <FontAwesome5 name="chevron-right" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.weekHeader}>
//               {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
//                 <Text key={d} style={styles.weekCell}>
//                   {d}
//                 </Text>
//               ))}
//             </View>

//             {calRows.map((row, i) => (
//               <View key={i} style={styles.weekRow}>
//                 {row.map((cell, j) => {
//                   const iso = cell ? toISO(cell) : "";
//                   const disabled = !!cell && iso < todayISO();
//                   return (
//                     <TouchableOpacity
//                       key={j}
//                       style={[
//                         styles.dayCell,
//                         iso === tempDateISO && styles.daySelected,
//                         disabled && { opacity: 0.35 },
//                       ]}
//                       disabled={!cell || disabled}
//                       onPress={() => setTempDateISO(iso)}
//                     >
//                       <Text>{cell ? cell.getDate() : ""}</Text>
//                     </TouchableOpacity>
//                   );
//                 })}
//               </View>
//             ))}

//             <View style={styles.modalButtonsRow}>
//               <TouchableOpacity
//                 style={[styles.modalButton, { backgroundColor: "#F44336" }]}
//                 onPress={() => setCalendarVisible(false)}
//               >
//                 <Text style={styles.buttonText}>Cancelar</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
//                 onPress={() => {
//                   setFecha(fromISOtoDMY(tempDateISO));
//                   setCalendarVisible(false);
//                 }}
//               >
//                 <Text style={styles.buttonText}>Confirmar</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default ComprasScreen;

// // ======================
// // ESTILOS
// // ======================
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "beige" },
//   header: {
//     backgroundColor: "red",
//     padding: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   title: { color: "white", fontSize: 20, fontWeight: "bold" },

//   summaryContainer: {
//     margin: 16,
//     backgroundColor: "white",
//     padding: 16,
//     borderRadius: 12,
//   },
//   summaryLabel: { color: "#777" },
//   summaryAmount: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "red",
//   },

//   searchContainer: {
//     flexDirection: "row",
//     marginHorizontal: 16,
//     backgroundColor: "white",
//     padding: 10,
//     borderRadius: 10,
//     alignItems: "center",
//   },
//   searchInput: { marginLeft: 8, flex: 1 },

//   compraCard: {
//     backgroundColor: "white",
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 10,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   compraCategoria: { fontWeight: "bold" },
//   compraFecha: { color: "#777", marginBottom: 4 },
//   compraDetalle: { color: "#555", marginTop: 2 },
//   compraTotal: { marginTop: 6, fontWeight: "bold", color: "red" },

//   fab: {
//     position: "absolute",
//     right: 20,
//     bottom: 30,
//     width: 58,
//     height: 58,
//     borderRadius: 29,
//     backgroundColor: "red",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   modalBackground: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "center",
//   },
//   modalContainer: {
//     backgroundColor: "white",
//     margin: 20,
//     borderRadius: 12,
//     padding: 20,
//   },
//   modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center" },

//   label: { marginTop: 10, fontWeight: "bold" },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 8,
//     marginTop: 6,
//   },

//   dateBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 10,
//     marginTop: 6,
//   },
//   dateText: { marginLeft: 8 },

//   pickerContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
//   pickerOption: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 6,
//     borderRadius: 8,
//     marginRight: 6,
//     marginBottom: 6,
//   },
//   pickerOptionActive: {
//     backgroundColor: "red",
//     borderColor: "red",
//   },
//   pickerOptionText: { color: "#333" },
//   pickerOptionTextActive: { color: "white" },

//   addProductBtn: {
//     marginTop: 10,
//     backgroundColor: "#2196F3",
//     padding: 10,
//     borderRadius: 8,
//     alignItems: "center",
//   },

//   productoRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 6,
//   },

//   totalText: {
//     marginTop: 10,
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "red",
//     textAlign: "right",
//   },

//   modalButtonsRow: {
//     flexDirection: "row",
//     marginTop: 20,
//   },
//   modalButton: {
//     flex: 1,
//     marginHorizontal: 5,
//     padding: 12,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   buttonText: { color: "white", fontWeight: "bold" },

//   calendarCard: {
//     backgroundColor: "white",
//     margin: 20,
//     borderRadius: 12,
//     padding: 16,
//   },
//   calHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   calTitle: { fontWeight: "bold" },
//   weekHeader: { flexDirection: "row", marginTop: 8 },
//   weekCell: { flex: 1, textAlign: "center", fontWeight: "bold" },
//   weekRow: { flexDirection: "row" },
//   dayCell: {
//     flex: 1,
//     height: 36,
//     alignItems: "center",
//     justifyContent: "center",
//     margin: 1,
//     borderRadius: 6,
//   },
//   daySelected: {
//     backgroundColor: "#FFD6CC",
//   },
// });

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

// ======================
// Helpers calendario
// ======================
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISOtoDMY = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const todayISO = () => toISO(new Date());

const monthMatrix = (year: number, month0: number) => {
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
};

const Meses = [
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

// ======================
// Pantalla
// ======================
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
  // ESTADOS
  // =====================
  const [compras, setCompras] = useState<StoredCompra[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);

  // ✅ EDITAR (sin cambiar fecha)
  const [editingCompra, setEditingCompra] = useState<StoredCompra | null>(null);

  // ---- fecha ----
  const [fecha, setFecha] = useState<string>("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [tempDateISO, setTempDateISO] = useState(todayISO());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth0, setCalMonth0] = useState(new Date().getMonth());
  const calRows = useMemo(
    () => monthMatrix(calYear, calMonth0),
    [calYear, calMonth0]
  );

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
  // LOAD LOCAL
  // ============================
  useEffect(() => {
    (async () => {
      const local = await loadCompras(userId);
      if (local.length) setCompras(local);
    })();
  }, [userId]);

  // ============================
  // FIRESTORE
  // ============================
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

    const unsub = onSnapshot(colRef, async (snapshot) => {
      const cloud: StoredCompra[] = snapshot.docs.map((d) => ({
        ...(d.data() as StoredCompra),
        id: d.id,
      }));
      setCompras(cloud);
      await saveCompras(userId, cloud);
    });

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
    setFecha("");
    setEditingCompra(null);
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

    setProductos((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        descripcion: prodDesc.trim(),
        cantidad,
        precio,
      },
    ]);

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
  // ABRIR EDITAR
  // ======================
  const abrirEditarCompra = (compra: StoredCompra) => {
    setEditingCompra(compra);
    setCategoria(compra.categoria);
    setProductos(compra.productos);

    // fecha solo informativa, NO editable
    setFecha(fromISOtoDMY(toISO(new Date(compra.fecha))));

    setModalVisible(true);
  };

  // ======================
  // GUARDAR (NUEVA / EDITAR)
  // ======================
  const handleGuardarCompra = async () => {
    if (saving) return;

    // En nueva compra, la fecha es obligatoria
    if (!editingCompra && !fecha) {
      Alert.alert("Error", "Selecciona una fecha");
      return;
    }

    if (productos.length === 0) {
      Alert.alert("Error", "Agrega al menos un producto");
      return;
    }

    setSaving(true);
    try {
      let compraFinal: StoredCompra;

      if (editingCompra) {
        // ✅ Edita TODO menos la fecha
        compraFinal = {
          ...editingCompra,
          categoria,
          productos,
          total: totalCompra,
        };

        const next = compras.map((c) =>
          c.id === compraFinal.id ? compraFinal : c
        );
        await persistLocal(next);

        if (userId) {
          setDoc(
            doc(db, "users", userId, "compras", compraFinal.id),
            compraFinal,
            {
              merge: true,
            }
          ).catch(() => {});
        }
      } else {
        // ➕ Nueva
        compraFinal = {
          id: Date.now().toString(),
          categoria,
          productos,
          total: totalCompra,
          fecha: new Date(fecha.split("/").reverse().join("-")).getTime(),
        };

        const next = [compraFinal, ...compras];
        await persistLocal(next);

        if (userId) {
          setDoc(
            doc(db, "users", userId, "compras", compraFinal.id),
            compraFinal,
            {
              merge: true,
            }
          ).catch(() => {});
        }
      }

      setModalVisible(false);
      resetForm();
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.compraFecha}>
          {new Date(item.fecha).toLocaleDateString()}
        </Text>

        {item.productos.map((p) => (
          <Text key={p.id} style={styles.compraDetalle}>
            • {p.descripcion} ({p.cantidad} × ${p.precio})
          </Text>
        ))}

        <Text style={styles.compraTotal}>Total: ${item.total.toFixed(2)}</Text>
      </View>

      <View style={{ justifyContent: "center", gap: 10 }}>
        <TouchableOpacity onPress={() => abrirEditarCompra(item)}>
          <MaterialIcons name="edit" size={22} color="#FF9800" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleEliminarCompra(String(item.id))}>
          <MaterialIcons name="delete" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case "Supermercado":
        return "local-grocery-store";
      case "Comida":
        return "restaurant";
      case "Transporte":
        return "directions-bus";
      case "Ropa":
        return "checkroom";
      case "Salud":
        return "health-and-safety";
      case "Suscripciones":
        return "subscriptions";
      case "Otros":
        return "category";
      default:
        return "apps";
    }
  };

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
      {/* FILTRO POR CATEGORÍA (GRID COMPACTO) */}
      <View style={styles.categoryGrid}>
        {["Todas", ...CATEGORIAS].map((cat) => {
          const active = filtroCategoria === cat;

          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBox, active && styles.categoryBoxActive]}
              onPress={() => setFiltroCategoria(cat)}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={getCategoriaIcon(cat)}
                size={22}
                color={active ? "white" : "#666"}
              />
              <Text
                style={[
                  styles.categoryBoxText,
                  active && styles.categoryBoxTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={comprasFiltradas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCompra}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* MODAL COMPRA */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView contentContainerStyle={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {editingCompra ? "Editar compra" : "Nueva compra"}
              </Text>

              <Text style={styles.label}>Fecha *</Text>

              {editingCompra ? (
                <View style={styles.dateBtn}>
                  <MaterialIcons name="event" size={18} color="#555" />
                  <Text style={styles.dateText}>{fecha}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setCalendarVisible(true)}
                >
                  <MaterialIcons name="event" size={18} color="#555" />
                  <Text style={styles.dateText}>
                    {fecha || "Seleccionar fecha"}
                  </Text>
                </TouchableOpacity>
              )}

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
                value={prodDesc}
                onChangeText={setProdDesc}
              />
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                keyboardType="numeric"
                value={prodCant}
                onChangeText={setProdCant}
              />
              <TextInput
                style={styles.input}
                placeholder="Precio"
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
                  <Text style={styles.buttonText}>
                    {editingCompra ? "Guardar cambios" : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL CALENDARIO */}
      <Modal transparent visible={calendarVisible} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.calendarCard}>
            <View style={styles.calHeader}>
              <TouchableOpacity
                onPress={() => {
                  const d = new Date(calYear, calMonth0 - 1, 1);
                  setCalYear(d.getFullYear());
                  setCalMonth0(d.getMonth());
                }}
              >
                <FontAwesome5 name="chevron-left" />
              </TouchableOpacity>

              <Text style={styles.calTitle}>
                {Meses[calMonth0]} {calYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  const d = new Date(calYear, calMonth0 + 1, 1);
                  setCalYear(d.getFullYear());
                  setCalMonth0(d.getMonth());
                }}
              >
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
                  const disabled = !!cell && iso < todayISO();
                  return (
                    <TouchableOpacity
                      key={j}
                      style={[
                        styles.dayCell,
                        iso === tempDateISO && styles.daySelected,
                        disabled && { opacity: 0.35 },
                      ]}
                      disabled={!cell || disabled}
                      onPress={() => setTempDateISO(iso)}
                    >
                      <Text>{cell ? cell.getDate() : ""}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#F44336" }]}
                onPress={() => setCalendarVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
                onPress={() => {
                  setFecha(fromISOtoDMY(tempDateISO));
                  setCalendarVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ComprasScreen;

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
  compraFecha: { color: "#777", marginBottom: 4 },
  compraDetalle: { color: "#555", marginTop: 2 },
  compraTotal: { marginTop: 6, fontWeight: "bold", color: "red" },

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
  },

  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  dateText: { marginLeft: 8 },

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

  calendarCard: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calTitle: { fontWeight: "bold" },
  weekHeader: { flexDirection: "row", marginTop: 8 },
  weekCell: { flex: 1, textAlign: "center", fontWeight: "bold" },
  weekRow: { flexDirection: "row" },
  dayCell: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    borderRadius: 6,
  },
  daySelected: {
    backgroundColor: "#FFD6CC",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",

    // sombra suave
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  categoryChipActive: {
    backgroundColor: "red",
    borderColor: "red",

    shadowOpacity: 0.25,
    elevation: 4,
  },

  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  categoryChipTextActive: {
    color: "white",
  },
  categoryGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  paddingHorizontal: 16,
  marginTop: 12,
},

categoryBox: {
  width: "25%",          // 👈 3 columnas reales
  height: 65,            // 👈 AQUÍ estaba el pedo (muy alto antes)
  backgroundColor: "#fff",
  borderRadius: 14,
  marginBottom: 12,

  alignItems: "center",
  justifyContent: "center",
  gap: 6,

  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 2,
},

categoryBoxActive: {
  backgroundColor: "red",
  shadowOpacity: 0.25,
  elevation: 4,
},

categoryBoxText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#555",
},

categoryBoxTextActive: {
  color: "white",
},

});
