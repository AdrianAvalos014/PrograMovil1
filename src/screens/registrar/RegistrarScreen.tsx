// //-----FASE2---------
// // src/screens/registrar/RegistrarScreen.tsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";
// import { auth } from "../../services/firebase-config";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// // agregue esto
// import { v4 as uuid } from "uuid";
// import NetInfo from "@react-native-community/netinfo";
// import {
//   loadUsers,
//   saveUsers,
//   StoredUser,
// } from "../../config/localStorageConfig";

// type RegisterScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "RegistrarScreen"
// >;

// interface RegisterScreenProps {
//   navigation: RegisterScreenNavigationProp;
// }

// const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
//   const [nombre, setNombre] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const validar = () => {
//     if (!nombre.trim() || !email.trim() || !password.trim()) {
//       Alert.alert("Faltan datos", "Completa nombre, correo y contraseña.");
//       return false;
//     }
//     // Validación simple de email
//     const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//     if (!okEmail) {
//       Alert.alert("Correo inválido", "Escribe un correo válido.");
//       return false;
//     }
//     if (password.length < 6) {
//       Alert.alert("Contraseña corta", "Mínimo 6 caracteres.");
//       return false;
//     }
//     return true;
//   };

//   // agregue esto
//   const handleRegister = async () => {
//     if (!validar()) return;

//     const users = await loadUsers();

//     if (users.find((u) => u.email === email)) {
//       Alert.alert("Error", "Ese correo ya está registrado");
//       return;
//     }

//     const localUser: StoredUser = {
//       id: uuid(),
//       email,
//       password,
//       nombre,
//       synced: false,
//     };

//     users.push(localUser);
//     await saveUsers(users);

//     const net = await NetInfo.fetch();

//     if (net.isConnected && net.isInternetReachable) {
//       try {
//         const cred = await createUserWithEmailAndPassword(
//           auth,
//           email,
//           password
//         );
//         await updateProfile(cred.user, { displayName: nombre });
//         localUser.synced = true;
//         await saveUsers(users);
//       } catch {
//         // queda pendiente para sincronizar
//       }
//     }

//     Alert.alert("Cuenta creada", "Puedes iniciar sesión incluso sin internet");
//     navigation.goBack();
//   };

//   // const handleRegister = async () => {
//   //   if (!validar()) return;
//   //   try {
//   //     setLoading(true);
//   //     const cred = await createUserWithEmailAndPassword(auth, email, password);
//   //     // Guarda el nombre como displayName
//   //     await updateProfile(cred.user, { displayName: nombre });

//   //     Alert.alert("Listo", "Usuario registrado. Ahora inicia sesión.");
//   //     navigation.goBack(); // regresa al Login
//   //   } catch (e: any) {
//   //     console.log("[register] error:", e?.code, e?.message);
//   //     let msg = "No se pudo registrar. Intenta de nuevo.";
//   //     if (e?.code === "auth/email-already-in-use") {
//   //       msg = "Ese correo ya está registrado.";
//   //     } else if (e?.code === "auth/invalid-email") {
//   //       msg = "Correo inválido.";
//   //     } else if (e?.code === "auth/weak-password") {
//   //       msg = "Contraseña muy débil.";
//   //     }
//   //     Alert.alert("Error", msg);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.card}>
//         <Text style={styles.title}>Crear cuenta</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Nombre completo"
//           placeholderTextColor={COLORS.textSecondary}
//           value={nombre}
//           onChangeText={setNombre}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Correo electrónico"
//           placeholderTextColor={COLORS.textSecondary}
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//           autoCapitalize="none"
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Contraseña"
//           placeholderTextColor={COLORS.textSecondary}
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//           autoCapitalize="none"
//         />

//         <TouchableOpacity
//           style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
//           onPress={handleRegister}
//           disabled={loading}
//         >
//           <Text style={styles.buttonText}>
//             {loading ? "Creando..." : "Registrarme"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "beige",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   card: {
//     width: "100%",
//     maxWidth: 340,
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 10,
//     elevation: 3,
//     gap: 12,
//   },
//   title: {
//     fontSize: FONT_SIZES.xxlarge,
//     fontWeight: "bold",
//     color: "red",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   input: {
//     height: 50,
//     borderColor: "red",
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     backgroundColor: "#f6f6f6",
//     color: COLORS.text,
//   },
//   button: {
//     backgroundColor: "red",
//     height: 50,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 4,
//   },
//   buttonText: {
//     color: COLORS.surface,
//     fontSize: FONT_SIZES.medium,
//     fontWeight: "bold",
//   },
//   link: {
//     marginTop: 10,
//     color: "red",
//     textAlign: "center",
//     textDecorationLine: "underline",
//   },
// });

// export default RegisterScreen;

//-----FASE2---------
// src/screens/registrar/RegistrarScreen.tsx

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";

// // Firebase
// import { auth } from "../../services/firebase-config";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

// // Offline-first
// import NetInfo from "@react-native-community/netinfo";
// import {
//   loadUsers,
//   saveUsers,
//   type StoredUser,
// } from "../../config/localStorageConfig";

// type RegisterScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "RegistrarScreen"
// >;

// interface RegisterScreenProps {
//   navigation: RegisterScreenNavigationProp;
// }

// const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
//   const [nombre, setNombre] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // -----------------------
//   // Validaciones
//   // -----------------------
//   const validar = () => {
//     if (!nombre.trim() || !email.trim() || !password.trim()) {
//       Alert.alert("Faltan datos", "Completa nombre, correo y contraseña.");
//       return false;
//     }

//     const emailNorm = email.trim().toLowerCase();
//     const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm);
//     if (!okEmail) {
//       Alert.alert("Correo inválido", "Escribe un correo válido.");
//       return false;
//     }

//     if (password.length < 6) {
//       Alert.alert("Contraseña corta", "Mínimo 6 caracteres.");
//       return false;
//     }

//     return true;
//   };

//   // -----------------------
//   // Registro OFFLINE-FIRST
//   // -----------------------
//   const handleRegister = async () => {
//     if (!validar()) return;

//     setLoading(true);

//     const emailNorm = email.trim().toLowerCase();

//     try {
//       // 1️⃣ Cargar usuarios locales
//       const users = await loadUsers();

//       if (users.find((u) => u.email === emailNorm && !u.deleted)) {
//         Alert.alert("Error", "Ese correo ya está registrado.");
//         return;
//       }

//       // 2️⃣ Crear usuario LOCAL (sin uuid)
//       const localUser: StoredUser = {
//         id: `${Date.now()}-${Math.random()}`,
//         email: emailNorm,
//         password,
//         nombre: nombre.trim(),
//         synced: false,
//       };

//       users.push(localUser);
//       await saveUsers(users);

//       // 3️⃣ Intentar Firebase SOLO si hay internet
//       const net = await NetInfo.fetch();
//       if (net.isConnected && net.isInternetReachable) {
//         try {
//           const cred = await createUserWithEmailAndPassword(
//             auth,
//             emailNorm,
//             password
//           );
//           await updateProfile(cred.user, {
//             displayName: nombre.trim(),
//           });

//           localUser.synced = true;
//           await saveUsers(users);
//         } catch {
//           // Queda pendiente para sincronización automática
//         }
//       }

//       Alert.alert(
//         "Cuenta creada",
//         "Ya puedes iniciar sesión incluso sin internet."
//       );
//       navigation.goBack();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.card}>
//         <Text style={styles.title}>Crear cuenta</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Nombre completo"
//           placeholderTextColor={COLORS.textSecondary}
//           value={nombre}
//           onChangeText={setNombre}
//           editable={!loading}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Correo electrónico"
//           placeholderTextColor={COLORS.textSecondary}
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//           autoCapitalize="none"
//           editable={!loading}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Contraseña"
//           placeholderTextColor={COLORS.textSecondary}
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//           autoCapitalize="none"
//           editable={!loading}
//         />

//         <TouchableOpacity
//           style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
//           onPress={handleRegister}
//           disabled={loading}
//         >
//           <Text style={styles.buttonText}>
//             {loading ? "Creando..." : "Registrarme"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           disabled={loading}
//         >
//           <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// // -----------------------
// // Estilos
// // -----------------------
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "beige",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   card: {
//     width: "100%",
//     maxWidth: 340,
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 10,
//     elevation: 3,
//     gap: 12,
//   },
//   title: {
//     fontSize: FONT_SIZES.xxlarge,
//     fontWeight: "bold",
//     color: "red",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   input: {
//     height: 50,
//     borderColor: "red",
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     backgroundColor: "#f6f6f6",
//     color: COLORS.text,
//   },
//   button: {
//     backgroundColor: "red",
//     height: 50,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 4,
//   },
//   buttonText: {
//     color: COLORS.surface,
//     fontSize: FONT_SIZES.medium,
//     fontWeight: "bold",
//   },
//   link: {
//     marginTop: 10,
//     color: "red",
//     textAlign: "center",
//     textDecorationLine: "underline",
//   },
// });

// export default RegisterScreen;

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";

// // Firebase
// import { auth } from "../../services/firebase-config";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

// // Offline-first
// import NetInfo from "@react-native-community/netinfo";
// import {
//   loadUsers,
//   saveUsers,
//   type StoredUser,
// } from "../../config/localStorageConfig";

// type RegisterScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "RegistrarScreen"
// >;

// interface RegisterScreenProps {
//   navigation: RegisterScreenNavigationProp;
// }

// const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
//   const [nombre, setNombre] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   // ======================
//   // VALIDACIONES
//   // ======================
//   const validar = () => {
//     if (!nombre.trim() || !email.trim() || !password.trim()) {
//       Alert.alert("Faltan datos", "Completa todos los campos.");
//       return false;
//     }

//     const emailNorm = email.trim().toLowerCase();
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
//       Alert.alert("Correo inválido", "Escribe un correo válido.");
//       return false;
//     }

//     if (password.length < 6) {
//       Alert.alert("Contraseña corta", "Mínimo 6 caracteres.");
//       return false;
//     }

//     return true;
//   };

//   // ======================
//   // REGISTRO OFFLINE-FIRST
//   // ======================
//   const handleRegister = async () => {
//     if (!validar()) return;

//     setLoading(true);
//     const emailNorm = email.trim().toLowerCase();

//     try {
//       let users = await loadUsers();

//       // 🔥 ELIMINAR REGISTROS ELIMINADOS CON EL MISMO CORREO
//       users = users.filter(
//         (u) => !(u.email === emailNorm && u.deleted === true)
//       );

//       // ❌ SI YA EXISTE ACTIVO → BLOQUEAR
//       if (users.some((u) => u.email === emailNorm && !u.deleted)) {
//         Alert.alert("Error", "Ese correo ya está registrado.");
//         return;
//       }

//       // 🧠 CREAR USUARIO LOCAL
//       const localUser: StoredUser = {
//         id: `${Date.now()}-${Math.random()}`,
//         email: emailNorm,
//         password,
//         nombre: nombre.trim(),
//         synced: false,
//         deleted: false,
//       };

//       users.push(localUser);
//       await saveUsers(users);

//       // 🌐 INTENTAR FIREBASE SI HAY INTERNET
//       const net = await NetInfo.fetch();
//       if (net.isConnected && net.isInternetReachable) {
//         try {
//           const cred = await createUserWithEmailAndPassword(
//             auth,
//             emailNorm,
//             password
//           );

//           await updateProfile(cred.user, {
//             displayName: nombre.trim(),
//           });

//           localUser.synced = true;
//           await saveUsers(users);
//         } catch (e: any) {
//           // si falla, queda pendiente para sync
//           console.log("⚠️ Firebase registro pendiente:", e?.code);
//         }
//       }

//       Alert.alert(
//         "Cuenta creada",
//         "Ya puedes iniciar sesión incluso sin internet."
//       );
//       navigation.goBack();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.card}>
//         <Text style={styles.title}>Crear cuenta</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Nombre completo"
//           value={nombre}
//           onChangeText={setNombre}
//           editable={!loading}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Correo electrónico"
//           value={email}
//           onChangeText={setEmail}
//           autoCapitalize="none"
//           keyboardType="email-address"
//           editable={!loading}
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Contraseña"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//           editable={!loading}
//         />

//         <TouchableOpacity
//           style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
//           onPress={handleRegister}
//           disabled={loading}
//         >
//           <Text style={styles.buttonText}>
//             {loading ? "Creando..." : "Registrarme"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
//           <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "beige",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   card: {
//     width: "100%",
//     maxWidth: 340,
//     backgroundColor: "#fff",
//     borderRadius: 16,
//     padding: 20,
//     elevation: 3,
//     gap: 12,
//   },
//   title: {
//     fontSize: FONT_SIZES.xxlarge,
//     fontWeight: "bold",
//     color: "red",
//     textAlign: "center",
//   },
//   input: {
//     height: 50,
//     borderColor: "red",
//     borderWidth: 1,
//     borderRadius: 10,
//     paddingHorizontal: 14,
//     backgroundColor: "#f6f6f6",
//   },
//   button: {
//     backgroundColor: "red",
//     height: 50,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: FONT_SIZES.medium,
//   },
//   link: {
//     marginTop: 10,
//     color: "red",
//     textAlign: "center",
//     textDecorationLine: "underline",
//   },
// });

// export default RegisterScreen;

// src/screens/registrar/RegistrarScreen.tsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";

// // Offline
// import {
//   loadUsers,
//   saveUsers,
//   type StoredUser,
// } from "../../config/localStorageConfig";

// type RegisterScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "RegistrarScreen"
// >;

// interface Props {
//   navigation: RegisterScreenNavigationProp;
// }

// const RegisterScreen: React.FC<Props> = ({ navigation }) => {
//   const [nombre, setNombre] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const validar = () => {
//     if (!nombre.trim() || !email.trim() || !password.trim()) {
//       Alert.alert("Faltan datos", "Completa todos los campos");
//       return false;
//     }
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       Alert.alert("Correo inválido");
//       return false;
//     }
//     if (password.length < 6) {
//       Alert.alert("Contraseña muy corta");
//       return false;
//     }
//     return true;
//   };

//   const handleRegister = async () => {
//     if (!validar()) return;
//     setLoading(true);

//     const emailNorm = email.trim().toLowerCase();

//     try {
//       const users = await loadUsers();

//       // 🔥 SI EXISTE LOCAL Y NO ESTÁ BORRADO → NO DEJAR
//       if (users.some((u) => u.email === emailNorm && !u.deleted)) {
//         Alert.alert("Error", "Ese correo ya existe en este dispositivo");
//         return;
//       }

//       const newUser: StoredUser = {
//         id: `${Date.now()}-${Math.random()}`,
//         email: emailNorm,
//         password,
//         nombre: nombre.trim(),
//         synced: false, // 👈 CLAVE
//       };

//       await saveUsers([...users, newUser]);

//       Alert.alert(
//         "Cuenta creada",
//         "Cuenta creada localmente. Se sincronizará al tener internet."
//       );

//       navigation.goBack();
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//     >
//       <View style={styles.card}>
//         <Text style={styles.title}>Crear cuenta</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Nombre"
//           value={nombre}
//           onChangeText={setNombre}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Correo"
//           value={email}
//           onChangeText={setEmail}
//           autoCapitalize="none"
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Contraseña"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//         />

//         <TouchableOpacity style={styles.button} onPress={handleRegister}>
//           <Text style={styles.buttonText}>
//             {loading ? "Creando..." : "Registrarme"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "beige", justifyContent: "center" },
//   card: { margin: 20, padding: 20, backgroundColor: "#fff", borderRadius: 12 },
//   title: { fontSize: FONT_SIZES.xxlarge, textAlign: "center", color: "red" },
//   input: {
//     borderWidth: 1,
//     borderColor: "red",
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 10,
//   },
//   button: {
//     backgroundColor: "red",
//     padding: 12,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   buttonText: { color: "#fff", fontWeight: "bold" },
// });

// export default RegisterScreen;

// src/screens/auth/RegistrarScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../../types";

// Offline only
import {
  loadUsers,
  saveUsers,
  type StoredUser,
} from "../../config/localStorageConfig";

type RegisterNav = StackNavigationProp<RootStackParamList, "RegistrarScreen">;

interface Props {
  navigation: RegisterNav;
}

const RegistrarScreen: React.FC<Props> = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const emailNorm = email.trim().toLowerCase();

    if (!nombre || !emailNorm || password.length < 6) {
      Alert.alert("Error", "Datos inválidos");
      return;
    }

    setLoading(true);

    try {
      const users = await loadUsers();

      if (users.some((u) => u.email === emailNorm && !u.deleted)) {
        Alert.alert("Error", "Ese correo ya existe");
        return;
      }

      const newUser: StoredUser = {
        id: `local-${Date.now()}`,
        email: emailNorm,
        password,
        nombre,
        synced: false,
        deleted: false,
      };

      await saveUsers([...users, newUser]);

      Alert.alert(
        "Cuenta creada",
        "Se sincronizará automáticamente cuando haya internet"
      );

      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Crear cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Correo"
          autoCapitalize="none"
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "beige" },
  card: { padding: 20, backgroundColor: "#fff", margin: 20, borderRadius: 12 },
  title: { fontSize: FONT_SIZES.xxlarge, textAlign: "center", color: "red" },
  input: {
    borderWidth: 1,
    borderColor: "red",
    marginVertical: 8,
    padding: 10,
    borderRadius: 8,
  },
  button: { backgroundColor: "red", padding: 14, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});

export default RegistrarScreen;
