import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { auth } from "../services/firebase-config";

interface Props {
  children: React.ReactNode;
}

export default function AuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return <>{children}</>;
}
