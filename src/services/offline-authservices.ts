import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@tasklife/auth_cache";

export async function saveAuthCache(email: string, password: string) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ email, password }));
  } catch (e) {
    console.log("[auth-cache] save error", e);
  }
}

export async function loadAuthCache(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log("[auth-cache] load error", e);
    return null;
  }
}

export async function clearAuthCache() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.log("[auth-cache] clear error", e);
  }
}
