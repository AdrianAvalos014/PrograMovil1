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

// // 🔥 LOCAL STORAGE OFFLINE
// import {
//   markUserDeleted,
//   clearSession,
// } from "../../config/localStorageConfig";

// type ProfileNav = StackNavigationProp<RootStackParamList, "ProfileScreen">;

// interface Props {
//   navigation: ProfileNav;
// }

// type PendingAction = "password" | "email" | "delete" | null;

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// const ProfileScreen: React.FC<Props> = ({ navigation }) => {
//   const user = auth.currentUser;

//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmNewPassword, setConfirmNewPassword] = useState("");

//   const [newEmail, setNewEmail] = useState("");
//   const [confirmNewEmail, setConfirmNewEmail] = useState("");

//   const [loading, setLoading] = useState(false);

//   const [modalVisible, setModalVisible] = useState(false);
//   const [pendingAction, setPendingAction] = useState<PendingAction>(null);

//   const currentEmail = user?.email ?? "Sin correo";

//   // =====================================================
//   // 🔐 REAUTHENTICATE
//   // =====================================================
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

//   // =====================================================
//   // 🔑 CAMBIAR CONTRASEÑA
//   // =====================================================
//   const changePassword = async () => {
//     const pass = newPassword.trim();
//     const confirm = confirmNewPassword.trim();

//     if (!pass || pass.length < 6 || pass !== confirm) {
//       Alert.alert("Error", "Contraseñas inválidas.");
//       return;
//     }

//     try {
//       setLoading(true);
//       await reauthenticate();

//       if (!auth.currentUser) return;
//       await updatePassword(auth.currentUser, pass);

//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmNewPassword("");

//       Alert.alert("Listo", "Contraseña actualizada correctamente.");
//     } catch (e) {
//       Alert.alert("Error", "No se pudo cambiar la contraseña.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =====================================================
//   // 📧 CAMBIAR CORREO
//   // =====================================================
//   const changeEmail = async () => {
//     const email = newEmail.trim().toLowerCase();
//     const confirm = confirmNewEmail.trim().toLowerCase();

//     if (!emailRegex.test(email) || email !== confirm) {
//       Alert.alert("Error", "Correos inválidos.");
//       return;
//     }

//     try {
//       setLoading(true);
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
//       setLoading(false);
//     }
//   };

//   // =====================================================
//   // ❌ ELIMINAR CUENTA
//   // =====================================================
//   const deleteAccount = async () => {
//     try {
//       setLoading(true);
//       await reauthenticate();

//       const activeUser = auth.currentUser;
//       if (!activeUser || !activeUser.email) return;

//       // 🔥 MARCAR COMO ELIMINADO EN LOCAL
//       await markUserDeleted(activeUser.email);
//       await clearSession();

//       // 🔥 INTENTAR BORRAR EN FIREBASE
//       try {
//         await deleteUser(activeUser);
//       } catch {
//         // si falla Firebase no importa, local ya quedó limpio
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
//       setLoading(false);
//     }
//   };

//   // =====================================================
//   // CONFIRMACIONES
//   // =====================================================
//   const confirmAction = (action: PendingAction) => {
//     setPendingAction(action);
//     setCurrentPassword("");
//     setModalVisible(true);
//   };

//   const handleConfirm = () => {
//     setModalVisible(false);

//     if (pendingAction === "password") changePassword();
//     if (pendingAction === "email") changeEmail();
//     if (pendingAction === "delete") deleteAccount();

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
//             <TextInput style={styles.input} value={currentEmail} editable={false} />
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
//               disabled={loading}
//             >
//               <Text style={styles.primaryButtonText}>Confirmar</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Correo */}
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
//               disabled={loading}
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
//               disabled={loading}
//             >
//               <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* Modal contraseña */}
//       <Modal transparent visible={modalVisible} animationType="fade">
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
//               onPress={handleConfirm}
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
import { MaterialIcons } from "@expo/vector-icons";

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

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!currentPassword.trim()) {
      Alert.alert("Error", "Debes ingresar tu contraseña actual.");
      return;
    }

    if (!pass || !confirm) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    if (pass.length < 8) {
      Alert.alert(
        "Contraseña débil",
        "La nueva contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (pass !== confirm) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
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
    } catch {
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

      await markUserDeleted(activeUser.email);
      await clearSession();

      try {
        await deleteUser(activeUser);
      } catch {}

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

          {/* Cambiar contraseña */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
            <Text style={styles.helperText}>
              Mínimo 8 caracteres
            </Text>

            {/* Nueva */}
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showNewPassword}
                placeholder="Nueva contraseña"
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <MaterialIcons
                  name={showNewPassword ? "visibility-off" : "visibility"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar */}
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirmar contraseña"
                onChangeText={setConfirmNewPassword}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => confirmAction("password")}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          {/* Cambiar correo */}
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

      {/* Modal contraseña actual */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showCurrentPassword}
                placeholder="Contraseña actual"
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowCurrentPassword(!showCurrentPassword)
                }
              >
                <MaterialIcons
                  name={
                    showCurrentPassword ? "visibility-off" : "visibility"
                  }
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

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
    marginBottom: 6,
  },
  helperText: {
    fontSize: FONT_SIZES.small,
    color: "#666",
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f6f6f6",
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
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
