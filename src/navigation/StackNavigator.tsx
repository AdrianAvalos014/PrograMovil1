import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
// Importación de pantallas
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/home/HomeScreen";
import AgendaScreen from "../screens/agenda/AgendaScreen";
import TareasScreen from "../screens/tareas/TareasScreen";
import MedicamentosScreen from "../screens/medicamentos/MedicamentosScreen";
import ComprasScreen from "../screens/compras/ComprasScreen";
import ReportesScreen from "../screens/reportes/ReportesScreen";
import RegistrarScreen from "../screens/registrar/RegistrarScreen";
import RecuperarScreen from "../screens/recuperar/RecuperarScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

/**
 * Definición de los tipos para los parámetros de navegación
 * Esto ayuda a TypeScript a entender qué parámetros espera cada pantalla
 */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  AlumnoList: undefined;
  AgendaScreen: undefined;
  TareasScreen: undefined;
  ComprasScreen: undefined;
  MedicamentosScreen: undefined;
  ReportesScreen: undefined;
  RegistrarScreen: undefined;
  RecuperarScreen: undefined;
  ProfileScreen: undefined;

  AlumnoDetails: {
    nombre: string;
    id?: number;
  };
  ProfesorList: undefined;
  ProfesorDetails: {
    nombre: string;
    id?: number;
  };
  MateriaList: undefined;
  MateriaDetails: {
    nombre: string;
    id?: number;
  };
  GrupoList: undefined;
  GrupoDetails: {
    nombre: string;
    id?: number;
  };
};
/**
 * Creamos el Stack Navigator con tipado
 */
const Stack = createStackNavigator<RootStackParamList>();
/**
 * Componente principal de navegación
 * Gestiona todas las rutas de la aplicación
 */
const StackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: "red", //Color de hasta arriba
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
      }}
    >
      {/* Pantalla de Login */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Iniciar Sesión",
          headerShown: false, // Ocultamos el header en login
        }}
      />
      {/* Pantalla Principal */}
      {/* <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Task&Life",
          headerLeft: () => null, // Evitamos el botón de regreso
        }}
      /> */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      {/* Pantalla de perfil */}
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: "Mi Perfil",
        }}
      />
      {/* Pantallas de Agenda */}
      <Stack.Screen
        name="AgendaScreen"
        component={AgendaScreen}
        options={{
          title: "Agenda",
          headerLeft: () => null, // Evitamos el botón de regreso
        }}
      />
      {/* Pantallas de Tareas */}
      <Stack.Screen
        name="TareasScreen"
        component={TareasScreen}
        options={{
          title: "Tareas",
          headerLeft: () => null, // Evitamos el botón de regreso
        }}
      />
      {/* Pantallas de Medicamentos */}
      <Stack.Screen
        name="MedicamentosScreen"
        component={MedicamentosScreen}
        options={{
          title: "Medicamentos",
          headerLeft: () => null, // Evitamos el botón de regreso
        }}
      />
      {/* Pantallas de Compras */}
      <Stack.Screen
        name="ComprasScreen"
        component={ComprasScreen}
        options={{
          title: "Compras",
          headerLeft: () => null, // Evitamos el botón de regreso
        }}
      />
      {/* Pantallas de Reportes */}
      <Stack.Screen
        name="ReportesScreen"
        component={ReportesScreen}
        options={{
          title: "Reportes",
          headerLeft: () => null, // Evitamos el botón de regreso
        }}
      />
      {/* Pantallas de Registrar */}
      <Stack.Screen
        name="RegistrarScreen"
        component={RegistrarScreen}
        options={{ headerShown: false }}
      />
      {/* Pantallas de Recuperar */}
      <Stack.Screen
        name="RecuperarScreen"
        component={RecuperarScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
export default StackNavigator;
