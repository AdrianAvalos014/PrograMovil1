// ==================================================
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../../types";

// Firebase
import { auth } from "../../services/firebase-config";
import { signInWithEmailAndPassword } from "firebase/auth";

// Offline-first
import NetInfo from "@react-native-community/netinfo";
import { loadUsers, saveSession } from "../../config/localStorageConfig";

const loginImage = require("../../../assets/login_image.png");

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // 🔐 LOGIN OFFLINE-FIRST (CORREGIDO)
  // ============================================================
  const handleLogin = async () => {
    const emailNorm = email.trim().toLowerCase();
    const passNorm = password.trim();

    if (!emailNorm || !passNorm) {
      Alert.alert("Faltan datos", "Ingresa correo y contraseña.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      Alert.alert("Correo inválido", "Escribe un correo válido.");
      return;
    }

    try {
      setIsLoading(true);

      const net = await NetInfo.fetch();

      // =================================================
      // 1️⃣ SI HAY INTERNET → FIREBASE MANDA
      // =================================================
      if (net.isConnected && net.isInternetReachable) {
        try {
          await signInWithEmailAndPassword(auth, emailNorm, passNorm);
          navigation.replace("Home");
          return;
        } catch (e) {
          Alert.alert("Error", "Credenciales incorrectas.");
          return;
        }
      }

      // =================================================
      // 2️⃣ SIN INTERNET → LOGIN LOCAL
      // =================================================
      const users = await loadUsers();
      const localUser = users.find(
        (u) => u.email === emailNorm && u.password === passNorm && !u.deleted
      );

      if (!localUser) {
        Alert.alert("Error", "Credenciales incorrectas.");
        return;
      }

      await saveSession(localUser);
      navigation.replace("Home");
    } catch (e) {
      console.log("[login] error:", e);
      Alert.alert("Error", "No se pudo iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => navigation.navigate("RecuperarScreen");
  const handleRegister = () => navigation.navigate("RegistrarScreen");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Image source={loginImage} style={styles.loginImage} />

        <Text style={styles.title}>Task&Life</Text>
        <Text style={styles.subtitle}>Iniciar Sesión</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.loginButton, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Ingresando..." : "Iniciar Sesión"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.link}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ===============================================
//  ESTILOS
// ===============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loginImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  title: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.large,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: { width: "100%", maxWidth: 320 },
  input: {
    height: 50,
    borderColor: "red",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: FONT_SIZES.medium,
    backgroundColor: "#f6f6f6",
    color: COLORS.text,
  },
  loginButton: {
    backgroundColor: "red",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  loginButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: 28,
    alignItems: "center",
    gap: 12,
  },
  link: {
    color: "red",
    fontSize: FONT_SIZES.medium,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
