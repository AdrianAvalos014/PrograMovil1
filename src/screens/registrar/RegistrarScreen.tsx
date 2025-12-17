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
import NetInfo from "@react-native-community/netinfo";

import { RootStackParamList } from "../../navigation/StackNavigator";
import { FONT_SIZES } from "../../../types";

// 🔐 Firebase
import { auth, db } from "../../services/firebase-config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// 💾 Offline
import {
  loadUsers,
  saveUsers,
  type StoredUser,
} from "../../config/localStorageConfig";

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RegistrarScreen"
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ======================
  // VALIDACIONES
  // ======================
  const validar = () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Completa todos los campos.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      Alert.alert(
        "Correo inválido",
        "El correo debe contener '@' y terminar en '.com'."
      );
      return false;
    }

    if (password.length < 8) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 8 caracteres."
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validar()) return;
    setLoading(true);

    const emailNorm = email.trim().toLowerCase();

    try {
      const net = await NetInfo.fetch();
      const hasInternet = net.isConnected && net.isInternetReachable;

      // 🔥 CON INTERNET
      if (hasInternet) {
        const cred = await createUserWithEmailAndPassword(
          auth,
          emailNorm,
          password
        );

        await setDoc(doc(db, "users", cred.user.uid), {
          email: emailNorm,
          nombre: nombre.trim(),
          createdAt: Date.now(),
        });

        Alert.alert("Cuenta creada", "Usuario registrado correctamente.");
        navigation.goBack();
        return;
      }

      // 📦 SIN INTERNET
      const users = await loadUsers();

      if (users.some((u) => u.email === emailNorm && !u.deleted)) {
        Alert.alert("Error", "Ese correo ya existe en este dispositivo.");
        return;
      }

      const newUser: StoredUser = {
        id: `${Date.now()}-${Math.random()}`,
        email: emailNorm,
        password,
        nombre: nombre.trim(),
        synced: false,
      };

      await saveUsers([...users, newUser]);

      Alert.alert(
        "Sin conexión",
        "Cuenta creada localmente. Se sincronizará cuando vuelva el internet."
      );

      navigation.goBack();
    } catch {
      Alert.alert("Error", "No se pudo registrar el usuario.");
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
        <Text style={styles.subtitle}>
          Regístrate para comenzar a usar la aplicación
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.helperText}>Debe contener @ y terminar en .com</Text>

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text style={styles.helperText}>
          Mínimo 8 caracteres
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creando cuenta..." : "Registrarme"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZES.small,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: FONT_SIZES.medium,
    marginTop: 12,
  },
  helperText: {
    fontSize: FONT_SIZES.small,
    color: "#888",
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    marginTop: 24,
    backgroundColor: "red",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
});

export default RegisterScreen;
