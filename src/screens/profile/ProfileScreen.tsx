// // src/screens/profile/ProfileScreen.tsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   SafeAreaView,
//   Modal,
//   ScrollView,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { CommonActions } from "@react-navigation/native";

// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";
// import { auth } from "../../services/firebase-config";

// import {
//   EmailAuthProvider,
//   reauthenticateWithCredential,
//   updatePassword,
//   updateEmail,
//   deleteUser,
//   verifyBeforeUpdateEmail,
// } from "firebase/auth";

// type ProfileNav = StackNavigationProp<RootStackParamList, "ProfileScreen">;

// interface Props {
//   navigation: ProfileNav;
// }

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// type PendingAction = "password" | "email" | "delete" | null;

// const ProfileScreen: React.FC<Props> = ({ navigation }) => {
//   const user = auth.currentUser;

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmNewPassword, setConfirmNewPassword] = useState("");

//   const [newEmail, setNewEmail] = useState("");
//   const [confirmNewEmail, setConfirmNewEmail] = useState("");

//   const [loadingPass, setLoadingPass] = useState(false);
//   const [loadingEmail, setLoadingEmail] = useState(false);
//   const [loadingDelete, setLoadingDelete] = useState(false);

//   // Modal para pedir contraseña actual
//   const [passwordPromptVisible, setPasswordPromptVisible] = useState(false);
//   const [pendingAction, setPendingAction] = useState<PendingAction>(null);

//   const currentEmail = user?.email ?? "Sin correo";

//   const reauthenticate = async () => {
//     const activeUser = auth.currentUser || user;

//     if (!activeUser || !activeUser.email) {
//       // no disparamos error genérico, avisamos directo
//       throw new Error("no-user");
//     }

//     const pass = currentPassword.trim();
//     if (!pass) {
//       throw new Error("missing-password");
//     }

//     const credential = EmailAuthProvider.credential(activeUser.email, pass);
//     await reauthenticateWithCredential(activeUser, credential);
//   };

//   // --- Cambiar contraseña (lógica real) ---
//   const doChangePassword = async () => {
//     const newPass = newPassword.trim();
//     const confirm = confirmNewPassword.trim();

//     if (!newPass || !confirm) {
//       Alert.alert("Faltan datos", "Completa todos los campos de contraseña.");
//       return;
//     }

//     if (newPass.length < 6) {
//       Alert.alert(
//         "Contraseña muy corta",
//         "La contraseña debe tener al menos 6 caracteres."
//       );
//       return;
//     }

//     if (newPass !== confirm) {
//       Alert.alert(
//         "No coinciden",
//         "La confirmación de la contraseña no coincide."
//       );
//       return;
//     }

//     try {
//       setLoadingPass(true);
//       await reauthenticate();

//       const activeUser = auth.currentUser || user;
//       if (!activeUser) {
//         Alert.alert(
//           "Sin usuario",
//           "No se encontró un usuario autenticado. Vuelve a iniciar sesión."
//         );
//         return;
//       }

//       await updatePassword(activeUser, newPass);

//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmNewPassword("");

//       Alert.alert("Listo", "Tu contraseña se actualizó correctamente.");
//     } catch (e: any) {
//       console.log("[profile] changePassword error:", e?.code, e?.message);
//       const code = e?.code || "";
//       if (e?.message === "missing-password") {
//         Alert.alert("Error", "Debes escribir tu contraseña actual.");
//       } else if (e?.message === "no-user") {
//         Alert.alert(
//           "Sin usuario",
//           "No se encontró un usuario autenticado. Vuelve a iniciar sesión."
//         );
//       } else if (
//         code === "auth/wrong-password" ||
//         code === "auth/invalid-credential"
//       ) {
//         Alert.alert(
//           "Contraseña incorrecta",
//           "La contraseña actual no es válida."
//         );
//       } else if (code === "auth/requires-recent-login") {
//         Alert.alert(
//           "Por seguridad",
//           "Por favor vuelve a iniciar sesión y prueba de nuevo."
//         );
//       } else {
//         Alert.alert(
//           "Error al cambiar contraseña",
//           `No se pudo cambiar la contraseña.\n\nCódigo: ${
//             code || "desconocido"
//           }`
//         );
//       }
//     } finally {
//       setLoadingPass(false);
//     }
//   };

//   // --- Cambiar correo (lógica real) ---
//   // --- Cambiar correo (lógica real) ---
//   const doChangeEmail = async () => {
//     // El correo ya fue validado en askConfirmEmailChange
//     const normalized = newEmail.trim().toLowerCase();

//     try {
//       setLoadingEmail(true);
//       await reauthenticate();

//       const activeUser = auth.currentUser || user;
//       if (!activeUser) {
//         Alert.alert(
//           "Sin usuario",
//           "No se encontró un usuario autenticado. Vuelve a iniciar sesión."
//         );
//         return;
//       }

//       // 🔴 AQUÍ EL CAMBIO IMPORTANTE:
//       // En vez de updateEmail, usamos verifyBeforeUpdateEmail
//       await verifyBeforeUpdateEmail(activeUser, normalized);

//       setCurrentPassword("");
//       setConfirmNewEmail(normalized);

//       Alert.alert(
//         "Revisa tu correo",
//         `Te enviamos un enlace de verificación a:\n\n${normalized}\n\nAbre ese correo y confirma el cambio. Después podrás iniciar sesión con tu nuevo correo.`,
//         [
//           {
//             text: "OK",
//             onPress: () => {
//               // Opcional: puedes mandarlo a login si quieres
//               navigation.dispatch(
//                 CommonActions.reset({
//                   index: 0,
//                   routes: [{ name: "Login" }],
//                 })
//               );
//             },
//           },
//         ]
//       );
//     } catch (e: any) {
//       console.log("[profile] changeEmail error:", e?.code, e?.message);
//       const code = e?.code || "";

//       if (e?.message === "missing-password") {
//         Alert.alert("Error", "Debes escribir tu contraseña actual.");
//       } else if (e?.message === "no-user") {
//         Alert.alert(
//           "Sin usuario",
//           "No se encontró un usuario autenticado. Vuelve a iniciar sesión."
//         );
//       } else if (
//         code === "auth/wrong-password" ||
//         code === "auth/invalid-credential"
//       ) {
//         Alert.alert(
//           "Contraseña incorrecta",
//           "La contraseña actual no es válida."
//         );
//       } else if (code === "auth/email-already-in-use") {
//         Alert.alert(
//           "Correo en uso",
//           "Ese correo ya está registrado en otra cuenta."
//         );
//       } else if (code === "auth/invalid-email") {
//         Alert.alert("Correo inválido", "Escribe un correo válido.");
//       } else if (code === "auth/requires-recent-login") {
//         Alert.alert(
//           "Por seguridad",
//           "Por favor vuelve a iniciar sesión y prueba de nuevo."
//         );
//       } else if (code === "auth/network-request-failed") {
//         Alert.alert(
//           "Sin conexión",
//           "No se pudo contactar con el servidor. Revisa tu conexión a internet."
//         );
//       } else if (code === "auth/operation-not-allowed") {
//         Alert.alert(
//           "Configuración de Firebase",
//           "Tu proyecto requiere verificar el nuevo correo mediante un enlace de verificación. Ya cambiamos el flujo para enviarte ese correo automáticamente."
//         );
//       } else {
//         Alert.alert(
//           "Error al cambiar correo",
//           `No se pudo cambiar el correo.\n\nCódigo: ${
//             code || "desconocido"
//           }\nDetalle: ${e?.message || "—"}`
//         );
//       }
//     } finally {
//       setLoadingEmail(false);
//     }
//   };

//   // --- Eliminar cuenta (lógica real) ---
//   const doDeleteAccount = async () => {
//     try {
//       setLoadingDelete(true);
//       await reauthenticate();

//       const activeUser = auth.currentUser || user;
//       if (!activeUser) {
//         Alert.alert(
//           "Sin usuario",
//           "No se encontró un usuario autenticado. Vuelve a iniciar sesión."
//         );
//         return;
//       }

//       await deleteUser(activeUser);

//       setCurrentPassword("");

//       Alert.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada.", [
//         {
//           text: "OK",
//           onPress: () => {
//             navigation.dispatch(
//               CommonActions.reset({
//                 index: 0,
//                 routes: [{ name: "Login" }],
//               })
//             );
//           },
//         },
//       ]);
//     } catch (e: any) {
//       console.log("[profile] deleteAccount error:", e?.code, e?.message);
//       const code = e?.code || "";

//       if (e?.message === "missing-password") {
//         Alert.alert("Error", "Debes escribir tu contraseña actual.");
//       } else if (e?.message === "no-user") {
//         Alert.alert(
//           "Sin usuario",
//           "No se encontró un usuario autenticado. Vuelve a iniciar sesión."
//         );
//       } else if (
//         code === "auth/wrong-password" ||
//         code === "auth/invalid-credential"
//       ) {
//         Alert.alert(
//           "Contraseña incorrecta",
//           "La contraseña actual no es válida."
//         );
//       } else if (code === "auth/requires-recent-login") {
//         Alert.alert(
//           "Por seguridad",
//           "Vuelve a iniciar sesión y prueba de nuevo."
//         );
//       } else {
//         Alert.alert(
//           "Error al eliminar cuenta",
//           `No se pudo eliminar la cuenta.\n\nCódigo: ${code || "desconocido"}`
//         );
//       }
//     } finally {
//       setLoadingDelete(false);
//     }
//   };

//   // --- Flujos con confirmación y luego pedir contraseña ---

//   const askConfirmPasswordChange = () => {
//     const newPass = newPassword.trim();
//     const confirm = confirmNewPassword.trim();

//     if (!newPass || !confirm) {
//       Alert.alert("Faltan datos", "Completa todos los campos de contraseña.");
//       return;
//     }
//     if (newPass.length < 6) {
//       Alert.alert(
//         "Contraseña muy corta",
//         "La contraseña debe tener al menos 6 caracteres."
//       );
//       return;
//     }
//     if (newPass !== confirm) {
//       Alert.alert(
//         "No coinciden",
//         "La confirmación de la contraseña no coincide."
//       );
//       return;
//     }

//     Alert.alert("Confirmar cambio", "¿Estás seguro de realizar este cambio?", [
//       { text: "Cancelar", style: "cancel" },
//       {
//         text: "Confirmar",
//         onPress: () => {
//           setPendingAction("password");
//           setCurrentPassword("");
//           setPasswordPromptVisible(true);
//         },
//       },
//     ]);
//   };

//   const askConfirmEmailChange = () => {
//     const newMail = newEmail.trim().toLowerCase();
//     const confirmMail = confirmNewEmail.trim().toLowerCase();

//     if (!newMail || !confirmMail) {
//       Alert.alert("Faltan datos", "Completa ambos campos de correo.");
//       return;
//     }

//     if (newMail !== confirmMail) {
//       Alert.alert("No coinciden", "La confirmación del correo no coincide.");
//       return;
//     }

//     if (!emailRegex.test(newMail)) {
//       Alert.alert("Correo inválido", "Escribe un correo con formato válido.");
//       return;
//     }

//     if (newMail === currentEmail.toLowerCase()) {
//       Alert.alert("Sin cambios", "El nuevo correo es igual al actual.");
//       return;
//     }

//     Alert.alert("Confirmar cambio", "¿Estás seguro de realizar este cambio?", [
//       { text: "Cancelar", style: "cancel" },
//       {
//         text: "Confirmar",
//         onPress: () => {
//           setPendingAction("email");
//           setCurrentPassword(""); // se pedirá en el modal
//           setPasswordPromptVisible(true);
//         },
//       },
//     ]);
//   };

//   const askConfirmDeleteAccount = () => {
//     Alert.alert("Eliminar cuenta", "Todos tus datos se borrarán (confirmar)", [
//       { text: "Cancelar", style: "cancel" },
//       {
//         text: "Eliminar",
//         style: "destructive",
//         onPress: () => {
//           setPendingAction("delete");
//           setCurrentPassword("");
//           setPasswordPromptVisible(true);
//         },
//       },
//     ]);
//   };

//   // Cuando el usuario escribe la contraseña actual en el modal y da "Confirmar"
//   const handleConfirmWithPassword = () => {
//     if (!currentPassword.trim()) {
//       Alert.alert(
//         "Falta contraseña",
//         "Introduce tu contraseña actual para continuar."
//       );
//       return;
//     }

//     setPasswordPromptVisible(false);

//     if (pendingAction === "password") {
//       doChangePassword();
//     } else if (pendingAction === "email") {
//       doChangeEmail();
//     } else if (pendingAction === "delete") {
//       doDeleteAccount();
//     }

//     setPendingAction(null);
//   };

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.inner}>
//           <Text style={styles.infoText}>
//             No hay usuario autenticado. Vuelve a iniciar sesión.
//           </Text>
//           <TouchableOpacity
//             style={styles.primaryButton}
//             onPress={() =>
//               navigation.dispatch(
//                 CommonActions.reset({
//                   index: 0,
//                   routes: [{ name: "Login" }],
//                 })
//               )
//             }
//           >
//             <Text style={styles.primaryButtonText}>Ir a Iniciar Sesión</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.inner}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Correo actual */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Correo actual</Text>
//             <Text style={styles.label}>Correo actual</Text>
//             <TextInput
//               style={[styles.input, { backgroundColor: "#e0e0e0" }]}
//               value={currentEmail}
//               editable={false}
//             />
//           </View>

//           {/* Cambiar contraseña */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

//             <Text style={styles.label}>Contraseña nueva</Text>
//             <TextInput
//               style={styles.input}
//               value={newPassword}
//               onChangeText={setNewPassword}
//               secureTextEntry
//               placeholder="Contraseña nueva"
//               placeholderTextColor={COLORS.textSecondary}
//             />

//             <Text style={styles.label}>Confirmar contraseña</Text>
//             <TextInput
//               style={styles.input}
//               value={confirmNewPassword}
//               onChangeText={setConfirmNewPassword}
//               secureTextEntry
//               placeholder="Confirma la contraseña"
//               placeholderTextColor={COLORS.textSecondary}
//             />

//             <TouchableOpacity
//               style={[styles.primaryButton, { opacity: loadingPass ? 0.6 : 1 }]}
//               onPress={askConfirmPasswordChange}
//               disabled={loadingPass}
//             >
//               <Text style={styles.primaryButtonText}>
//                 {loadingPass ? "Guardando..." : "Confirmar"}
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Cambiar correo */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Cambiar correo</Text>

//             <Text style={styles.label}>Correo nuevo</Text>
//             <TextInput
//               style={styles.input}
//               value={newEmail}
//               onChangeText={setNewEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               placeholder="nuevo_correo@ejemplo.com"
//               placeholderTextColor={COLORS.textSecondary}
//             />

//             <Text style={styles.label}>Confirmar correo</Text>
//             <TextInput
//               style={styles.input}
//               value={confirmNewEmail}
//               onChangeText={setConfirmNewEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               placeholder="Repite el nuevo correo"
//               placeholderTextColor={COLORS.textSecondary}
//             />

//             <TouchableOpacity
//               style={[
//                 styles.primaryButton,
//                 { opacity: loadingEmail ? 0.6 : 1 },
//               ]}
//               onPress={askConfirmEmailChange}
//               disabled={loadingEmail}
//             >
//               <Text style={styles.primaryButtonText}>
//                 {loadingEmail ? "Guardando..." : "Confirmar"}
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Eliminar cuenta */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, { color: "red" }]}>
//               Eliminar cuenta
//             </Text>
//             <Text style={styles.dangerText}>
//               Esta acción es permanente. Se eliminarán todos tus datos y ya no
//               podrás acceder con este correo.
//             </Text>

//             <TouchableOpacity
//               style={[
//                 styles.deleteButton,
//                 { opacity: loadingDelete ? 0.6 : 1 },
//               ]}
//               onPress={askConfirmDeleteAccount}
//               disabled={loadingDelete}
//             >
//               <Text style={styles.deleteButtonText}>
//                 {loadingDelete ? "Eliminando..." : "Eliminar cuenta"}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* Modal para pedir la contraseña actual */}
//       <Modal
//         transparent
//         visible={passwordPromptVisible}
//         animationType="fade"
//         onRequestClose={() => {
//           setPasswordPromptVisible(false);
//           setPendingAction(null);
//           setCurrentPassword("");
//         }}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>
//               Introduce tu contraseña actual
//             </Text>
//             <TextInput
//               style={styles.input}
//               value={currentPassword}
//               onChangeText={setCurrentPassword}
//               secureTextEntry
//               placeholder="Contraseña actual"
//               placeholderTextColor={COLORS.textSecondary}
//             />
//             <View style={styles.modalButtonsRow}>
//               <TouchableOpacity
//                 style={[styles.modalButton, { backgroundColor: "#ccc" }]}
//                 onPress={() => {
//                   setPasswordPromptVisible(false);
//                   setPendingAction(null);
//                   setCurrentPassword("");
//                 }}
//               >
//                 <Text style={styles.modalButtonText}>Cancelar</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[
//                   styles.modalButton,
//                   { backgroundColor: "red", marginLeft: 8 },
//                 ]}
//                 onPress={handleConfirmWithPassword}
//               >
//                 <Text style={[styles.modalButtonText, { color: "#fff" }]}>
//                   Confirmar
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "beige",
//   },
//   inner: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     paddingBottom: 32,
//   },
//   section: {
//     backgroundColor: "#ffffff",
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 14,
//     elevation: 2,
//   },
//   sectionTitle: {
//     fontSize: FONT_SIZES.large,
//     fontWeight: "bold",
//     color: "black",
//     marginBottom: 8,
//   },
//   sectionHint: {
//     fontSize: FONT_SIZES.small,
//     color: COLORS.textSecondary,
//     marginBottom: 10,
//   },
//   label: {
//     fontSize: FONT_SIZES.small,
//     color: "black",
//     marginBottom: 4,
//   },
//   input: {
//     height: 44,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "red",
//     paddingHorizontal: 12,
//     marginBottom: 10,
//     backgroundColor: "#f6f6f6",
//     color: "black",
//     fontSize: FONT_SIZES.medium,
//   },
//   primaryButton: {
//     backgroundColor: "red",
//     borderRadius: 8,
//     paddingVertical: 10,
//     alignItems: "center",
//     marginTop: 4,
//   },
//   primaryButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: FONT_SIZES.medium,
//   },
//   dangerText: {
//     fontSize: FONT_SIZES.small,
//     color: "red",
//     marginBottom: 10,
//   },
//   deleteButton: {
//     backgroundColor: "#b00020",
//     borderRadius: 8,
//     paddingVertical: 10,
//     alignItems: "center",
//   },
//   deleteButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: FONT_SIZES.medium,
//   },
//   infoText: {
//     fontSize: FONT_SIZES.medium,
//     color: "black",
//     textAlign: "center",
//     marginHorizontal: 20,
//     marginBottom: 20,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.4)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContent: {
//     width: "85%",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 16,
//   },
//   modalTitle: {
//     fontSize: FONT_SIZES.large,
//     fontWeight: "bold",
//     color: "black",
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   modalButtonsRow: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     marginTop: 8,
//   },
//   modalButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//   },
//   modalButtonText: {
//     fontSize: FONT_SIZES.medium,
//     fontWeight: "bold",
//     color: "black",
//   },
// });

// export default ProfileScreen;

// // src/screens/profile/ProfileScreen.tsx
// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   SafeAreaView,
//   Modal,
//   ScrollView,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { CommonActions } from "@react-navigation/native";

// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";
// import { auth } from "../../services/firebase-config";

// // Firebase
// import {
//   EmailAuthProvider,
//   reauthenticateWithCredential,
//   updatePassword,
//   deleteUser,
//   verifyBeforeUpdateEmail,
// } from "firebase/auth";

// // 🔥 OFFLINE STORAGE
// import { markUserDeleted, clearSession } from "../../config/localStorageConfig";

// type ProfileNav = StackNavigationProp<RootStackParamList, "ProfileScreen">;

// interface Props {
//   navigation: ProfileNav;
// }

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// type PendingAction = "password" | "email" | "delete" | null;

// const ProfileScreen: React.FC<Props> = ({ navigation }) => {
//   const user = auth.currentUser;

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmNewPassword, setConfirmNewPassword] = useState("");

//   const [newEmail, setNewEmail] = useState("");
//   const [confirmNewEmail, setConfirmNewEmail] = useState("");

//   const [loadingPass, setLoadingPass] = useState(false);
//   const [loadingEmail, setLoadingEmail] = useState(false);
//   const [loadingDelete, setLoadingDelete] = useState(false);

//   const [passwordPromptVisible, setPasswordPromptVisible] = useState(false);
//   const [pendingAction, setPendingAction] = useState<PendingAction>(null);

//   const currentEmail = user?.email ?? "Sin correo";

//   // =========================
//   // 🔐 REAUTHENTICATE
//   // =========================
//   const reauthenticate = async () => {
//     const activeUser = auth.currentUser;
//     if (!activeUser || !activeUser.email) throw new Error("no-user");

//     if (!currentPassword.trim()) throw new Error("missing-password");

//     const credential = EmailAuthProvider.credential(
//       activeUser.email,
//       currentPassword.trim()
//     );
//     await reauthenticateWithCredential(activeUser, credential);
//   };

//   // =========================
//   // 🔑 CAMBIAR CONTRASEÑA
//   // =========================
//   const doChangePassword = async () => {
//     const pass = newPassword.trim();
//     const confirm = confirmNewPassword.trim();

//     if (!pass || pass.length < 6 || pass !== confirm) {
//       Alert.alert("Error", "Contraseñas inválidas.");
//       return;
//     }

//     try {
//       setLoadingPass(true);
//       await reauthenticate();
//       if (!auth.currentUser) return;

//       await updatePassword(auth.currentUser, pass);

//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmNewPassword("");

//       Alert.alert("Listo", "Contraseña actualizada correctamente.");
//     } catch {
//       Alert.alert("Error", "No se pudo cambiar la contraseña.");
//     } finally {
//       setLoadingPass(false);
//     }
//   };

//   // =========================
//   // 📧 CAMBIAR CORREO
//   // =========================
//   const doChangeEmail = async () => {
//     const email = newEmail.trim().toLowerCase();
//     const confirm = confirmNewEmail.trim().toLowerCase();

//     if (!emailRegex.test(email) || email !== confirm) {
//       Alert.alert("Error", "Correos inválidos.");
//       return;
//     }

//     try {
//       setLoadingEmail(true);
//       await reauthenticate();
//       if (!auth.currentUser) return;

//       await verifyBeforeUpdateEmail(auth.currentUser, email);

//       Alert.alert(
//         "Verifica tu correo",
//         "Te enviamos un enlace para confirmar el cambio.",
//         [
//           {
//             text: "OK",
//             onPress: () =>
//               navigation.dispatch(
//                 CommonActions.reset({
//                   index: 0,
//                   routes: [{ name: "Login" }],
//                 })
//               ),
//           },
//         ]
//       );
//     } catch {
//       Alert.alert("Error", "No se pudo cambiar el correo.");
//     } finally {
//       setLoadingEmail(false);
//     }
//   };

//   // =========================
//   // ❌ ELIMINAR CUENTA
//   // =========================
//   const doDeleteAccount = async () => {
//     try {
//       setLoadingDelete(true);
//       await reauthenticate();

//       const activeUser = auth.currentUser;
//       if (!activeUser || !activeUser.email) return;

//       // 🔥 BORRAR LOCAL
//       await markUserDeleted(activeUser.email);
//       await clearSession();

//       // 🔥 INTENTAR BORRAR FIREBASE
//       try {
//         await deleteUser(activeUser);
//       } catch {
//         // Firebase puede fallar, local ya quedó eliminado
//       }

//       Alert.alert("Cuenta eliminada", "Tu cuenta fue eliminada.", [
//         {
//           text: "OK",
//           onPress: () =>
//             navigation.dispatch(
//               CommonActions.reset({
//                 index: 0,
//                 routes: [{ name: "Login" }],
//               })
//             ),
//         },
//       ]);
//     } catch {
//       Alert.alert("Error", "No se pudo eliminar la cuenta.");
//     } finally {
//       setLoadingDelete(false);
//     }
//   };

//   // =========================
//   // CONFIRMACIONES
//   // =========================
//   const confirmAction = (action: PendingAction) => {
//     setPendingAction(action);
//     setCurrentPassword("");
//     setPasswordPromptVisible(true);
//   };

//   const handleConfirmWithPassword = () => {
//     setPasswordPromptVisible(false);
//     if (pendingAction === "password") doChangePassword();
//     if (pendingAction === "email") doChangeEmail();
//     if (pendingAction === "delete") doDeleteAccount();
//     setPendingAction(null);
//   };

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Text style={styles.infoText}>
//           No hay usuario autenticado. Inicia sesión.
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <ScrollView contentContainerStyle={styles.inner}>
//           {/* Correo */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Correo actual</Text>
//             <TextInput
//               style={styles.input}
//               value={currentEmail}
//               editable={false}
//             />
//           </View>

//           {/* Contraseña */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
//             <TextInput
//               style={styles.input}
//               secureTextEntry
//               placeholder="Nueva contraseña"
//               onChangeText={setNewPassword}
//             />
//             <TextInput
//               style={styles.input}
//               secureTextEntry
//               placeholder="Confirmar contraseña"
//               onChangeText={setConfirmNewPassword}
//             />
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() => confirmAction("password")}
//             >
//               <Text style={styles.primaryButtonText}>Confirmar</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Email */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Cambiar correo</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Nuevo correo"
//               onChangeText={setNewEmail}
//             />
//             <TextInput
//               style={styles.input}
//               placeholder="Confirmar correo"
//               onChangeText={setConfirmNewEmail}
//             />
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={() => confirmAction("email")}
//             >
//               <Text style={styles.primaryButtonText}>Confirmar</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Eliminar */}
//           <View style={styles.section}>
//             <Text style={[styles.sectionTitle, { color: "red" }]}>
//               Eliminar cuenta
//             </Text>
//             <TouchableOpacity
//               style={styles.deleteButton}
//               onPress={() => confirmAction("delete")}
//             >
//               <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* Modal contraseña */}
//       <Modal transparent visible={passwordPromptVisible} animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <TextInput
//               style={styles.input}
//               secureTextEntry
//               placeholder="Contraseña actual"
//               onChangeText={setCurrentPassword}
//             />
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={handleConfirmWithPassword}
//             >
//               <Text style={styles.primaryButtonText}>Confirmar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "beige" },
//   inner: { padding: 20 },
//   section: {
//     backgroundColor: "#fff",
//     padding: 15,
//     marginBottom: 14,
//     borderRadius: 10,
//   },
//   sectionTitle: {
//     fontSize: FONT_SIZES.large,
//     fontWeight: "bold",
//     marginBottom: 8,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "red",
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 8,
//     backgroundColor: "#f6f6f6",
//   },
//   primaryButton: {
//     backgroundColor: "red",
//     padding: 10,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   primaryButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   deleteButton: {
//     backgroundColor: "#b00020",
//     padding: 10,
//     borderRadius: 8,
//   },
//   deleteButtonText: {
//     color: "#fff",
//     textAlign: "center",
//     fontWeight: "bold",
//   },
//   infoText: {
//     textAlign: "center",
//     marginTop: 40,
//     fontSize: FONT_SIZES.medium,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.4)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalContent: {
//     width: "85%",
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 12,
//   },
// });

// export default ProfileScreen;



import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  ScrollView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { CommonActions } from "@react-navigation/native";

import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../../types";
import { auth } from "../../services/firebase-config";

// Firebase
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

// 🔥 LOCAL STORAGE OFFLINE
import {
  markUserDeleted,
  clearSession,
} from "../../config/localStorageConfig";

type ProfileNav = StackNavigationProp<RootStackParamList, "ProfileScreen">;

interface Props {
  navigation: ProfileNav;
}

type PendingAction = "password" | "email" | "delete" | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const currentEmail = user?.email ?? "Sin correo";

  // =====================================================
  // 🔐 REAUTHENTICATE
  // =====================================================
  const reauthenticate = async () => {
    const activeUser = auth.currentUser;
    if (!activeUser || !activeUser.email) throw new Error("no-user");

    if (!currentPassword.trim()) throw new Error("missing-password");

    const credential = EmailAuthProvider.credential(
      activeUser.email,
      currentPassword.trim()
    );

    await reauthenticateWithCredential(activeUser, credential);
  };

  // =====================================================
  // 🔑 CAMBIAR CONTRASEÑA
  // =====================================================
  const changePassword = async () => {
    const pass = newPassword.trim();
    const confirm = confirmNewPassword.trim();

    if (!pass || pass.length < 6 || pass !== confirm) {
      Alert.alert("Error", "Contraseñas inválidas.");
      return;
    }

    try {
      setLoading(true);
      await reauthenticate();

      if (!auth.currentUser) return;
      await updatePassword(auth.currentUser, pass);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      Alert.alert("Listo", "Contraseña actualizada correctamente.");
    } catch (e) {
      Alert.alert("Error", "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 📧 CAMBIAR CORREO
  // =====================================================
  const changeEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    const confirm = confirmNewEmail.trim().toLowerCase();

    if (!emailRegex.test(email) || email !== confirm) {
      Alert.alert("Error", "Correos inválidos.");
      return;
    }

    try {
      setLoading(true);
      await reauthenticate();

      if (!auth.currentUser) return;

      await verifyBeforeUpdateEmail(auth.currentUser, email);

      Alert.alert(
        "Verifica tu correo",
        "Te enviamos un enlace para confirmar el cambio.",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                })
              ),
          },
        ]
      );
    } catch {
      Alert.alert("Error", "No se pudo cambiar el correo.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ❌ ELIMINAR CUENTA
  // =====================================================
  const deleteAccount = async () => {
    try {
      setLoading(true);
      await reauthenticate();

      const activeUser = auth.currentUser;
      if (!activeUser || !activeUser.email) return;

      // 🔥 MARCAR COMO ELIMINADO EN LOCAL
      await markUserDeleted(activeUser.email);
      await clearSession();

      // 🔥 INTENTAR BORRAR EN FIREBASE
      try {
        await deleteUser(activeUser);
      } catch {
        // si falla Firebase no importa, local ya quedó limpio
      }

      Alert.alert("Cuenta eliminada", "Tu cuenta fue eliminada.", [
        {
          text: "OK",
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            ),
        },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo eliminar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CONFIRMACIONES
  // =====================================================
  const confirmAction = (action: PendingAction) => {
    setPendingAction(action);
    setCurrentPassword("");
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setModalVisible(false);

    if (pendingAction === "password") changePassword();
    if (pendingAction === "email") changeEmail();
    if (pendingAction === "delete") deleteAccount();

    setPendingAction(null);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.infoText}>
          No hay usuario autenticado. Inicia sesión.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner}>
          {/* Correo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Correo actual</Text>
            <TextInput style={styles.input} value={currentEmail} editable={false} />
          </View>

          {/* Contraseña */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Nueva contraseña"
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Confirmar contraseña"
              onChangeText={setConfirmNewPassword}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => confirmAction("password")}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {/* Correo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambiar correo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nuevo correo"
              onChangeText={setNewEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmar correo"
              onChangeText={setConfirmNewEmail}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => confirmAction("email")}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {/* Eliminar */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: "red" }]}>
              Eliminar cuenta
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmAction("delete")}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal contraseña */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="Contraseña actual"
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConfirm}
            >
              <Text style={styles.primaryButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige" },
  inner: { padding: 20 },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 14,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#f6f6f6",
  },
  primaryButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#b00020",
    padding: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  infoText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: FONT_SIZES.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
});

export default ProfileScreen;
