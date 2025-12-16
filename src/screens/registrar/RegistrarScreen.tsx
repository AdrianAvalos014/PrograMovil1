// src/screens/registrar/RegistrarScreen.tsx
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

// Offline
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

  const validar = () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Completa todos los campos");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Correo inválido");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña muy corta");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validar()) return;
    setLoading(true);

    const emailNorm = email.trim().toLowerCase();

    try {
      const users = await loadUsers();

      // 🔥 SI EXISTE LOCAL Y NO ESTÁ BORRADO → NO DEJAR
      if (users.some((u) => u.email === emailNorm && !u.deleted)) {
        Alert.alert("Error", "Ese correo ya existe en este dispositivo");
        return;
      }

      const newUser: StoredUser = {
        id: `${Date.now()}-${Math.random()}`,
        email: emailNorm,
        password,
        nombre: nombre.trim(),
        synced: false, // 👈 CLAVE
      };

      await saveUsers([...users, newUser]);

      Alert.alert(
        "Cuenta creada",
        "Cuenta creada localmente. Se sincronizará al tener internet."
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
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>
            {loading ? "Creando..." : "Registrarme"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige", justifyContent: "center" },
  card: { margin: 20, padding: 20, backgroundColor: "#fff", borderRadius: 12 },
  title: { fontSize: FONT_SIZES.xxlarge, textAlign: "center", color: "red" },
  input: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default RegisterScreen;