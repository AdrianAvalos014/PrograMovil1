// src/screens/auth/RecuperarScreen.tsx
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
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase-config";

type Nav = StackNavigationProp<RootStackParamList, "RecuperarScreen">;

export default function ForgotPasswordScreen({
  navigation,
}: {
  navigation: Nav;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const validateEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  const handleRecover = async () => {
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }
    if (!validateEmail(normalized)) {
      Alert.alert("Correo inválido", "Escribe un correo con formato válido.");
      return;
    }

    try {
      setSending(true);

      // Intento directo de envío del correo de recuperación
      await sendPasswordResetEmail(auth, normalized);

      Alert.alert(
        "Correo enviado",
        `Si ${normalized} está registrado, recibirás un enlace para restablecer tu contraseña.\n\nRevisa también SPAM.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      console.log("[recover] error:", e?.code, e?.message);
      const code = e?.code || "";

      if (code === "auth/user-not-found") {
        Alert.alert(
          "Usuario no encontrado",
          "No existe una cuenta con ese correo."
        );
      } else if (code === "auth/invalid-email") {
        Alert.alert("Correo inválido", "El formato del correo no es válido.");
      } else if (code === "auth/too-many-requests") {
        Alert.alert("Demasiados intentos", "Inténtalo más tarde.");
      } else if (code === "auth/network-request-failed") {
        Alert.alert("Sin conexión", "Verifica tu internet.");
      } else {
        Alert.alert(
          "Error",
          `No se pudo enviar el correo de recuperación.\n\nCódigo: ${
            code || "desconocido"
          }`
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Recuperar Contraseña</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!sending}
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, { opacity: sending ? 0.7 : 1 }]}
          onPress={handleRecover}
          disabled={sending}
        >
          <Text style={styles.buttonText}>
            {sending ? "Enviando..." : "Enviar enlace"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={sending}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.link}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "beige",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  title: {
    fontSize: FONT_SIZES.xxlarge,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: "red",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f6f6f6",
    color: COLORS.text,
  },
  button: {
    backgroundColor: "red",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  link: {
    marginTop: 10,
    color: "red",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
