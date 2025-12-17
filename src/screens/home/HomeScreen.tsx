// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   Pressable,
//   SafeAreaView,
//   StatusBar,
//   Image,
// } from "react-native";
// import { MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { CommonActions } from "@react-navigation/native";
// import { RootStackParamList } from "../../navigation/StackNavigator";
// import { COLORS, FONT_SIZES } from "../../../types";

// type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

// interface HomeScreenProps {
//   navigation: HomeScreenNavigationProp;
// }

// interface MenuOption {
//   id: string;
//   title: string;
//   icon: string;
//   iconLibrary: "FontAwesome5" | "MaterialIcons" | "Entypo";
//   route?: keyof RootStackParamList;
// }

// const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
//   const [menuVisible, setMenuVisible] = useState<boolean>(false);

//   const menuOptions: MenuOption[] = [
//     {
//       id: "agenda",
//       title: "Agenda",
//       icon: "calendar-alt",
//       iconLibrary: "FontAwesome5",
//       route: "AgendaScreen",
//     },
//     {
//       id: "tareas",
//       title: "Tareas",
//       icon: "tasks",
//       iconLibrary: "FontAwesome5",
//       route: "TareasScreen",
//     },
//     {
//       id: "medicamentos",
//       title: "Medicamentos",
//       icon: "pills",
//       iconLibrary: "FontAwesome5",
//       route: "MedicamentosScreen",
//     },
//     {
//       id: "compras",
//       title: "Compras",
//       icon: "shopping-cart",
//       iconLibrary: "FontAwesome5",
//       route: "ComprasScreen",
//     },
//     {
//       id: "reportes",
//       title: "Reportes",
//       icon: "bar-chart",
//       iconLibrary: "MaterialIcons",
//       route: "ReportesScreen",
//     },
//   ];

//   // const handleLogout = (): void => {
//   //   setMenuVisible(false);
//   //   navigation.dispatch(
//   //     CommonActions.reset({ index: 0, routes: [{ name: "Login" }] })
//   //   );
//   // };
//   const handleLogout = (): void => {
//     setMenuVisible(false);
//     navigation.dispatch(
//       CommonActions.reset({ index: 0, routes: [{ name: "Login" }] })
//     );
//   };

//   const handleProfile = (): void => {
//     setMenuVisible(false);
//     // Navegar a la pantalla "Mi perfil"
//     navigation.navigate("ProfileScreen");
//   };

//   const openMenu = (): void => setMenuVisible(true);
//   const closeMenu = (): void => setMenuVisible(false);

//   const handleNavigation = (option: MenuOption): void => {
//     if (option.route) navigation.navigate(option.route as never);
//   };

//   const renderIcon = (option: MenuOption) => {
//     let iconColor = "red";
//     if (option.id === "agenda") iconColor = "#4CAF50";
//     if (option.id === "tareas") iconColor = "#2196F3";
//     if (option.id === "medicamentos") iconColor = "#FF9800";
//     if (option.id === "compras") iconColor = "#9C27B0";
//     if (option.id === "reportes") iconColor = "#F44336";

//     const iconProps = { size: 42, color: iconColor };

//     switch (option.iconLibrary) {
//       case "FontAwesome5":
//         return <FontAwesome5 name={option.icon as any} {...iconProps} />;
//       case "MaterialIcons":
//         return <MaterialIcons name={option.icon as any} {...iconProps} />;
//       case "Entypo":
//         return <Entypo name={option.icon as any} {...iconProps} />;
//       default:
//         return <MaterialIcons name="help-outline" {...iconProps} />;
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar backgroundColor="red" barStyle="light-content" />

//       {/* Header */}
//       <View style={styles.headerBar}>
//         {/* Logo centrado */}
//         <Image
//           source={require("../../../assets/login_image.png")}
//           style={styles.logo}
//           resizeMode="contain"
//         />

//         <Text style={styles.headerTitle}>Task&Life</Text>

//         <TouchableOpacity style={styles.iconButton} onPress={openMenu}>
//           <MaterialIcons name="menu" size={24} color="white" />
//         </TouchableOpacity>
//       </View>

//       {/* Modal menú */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={menuVisible}
//         onRequestClose={closeMenu}
//       >
//         <View style={styles.menuOverlay}>
//           <View style={styles.menuContainer}>
//             <Text style={styles.menuTitle}>Menú de Usuario</Text>
//             <Pressable style={styles.menuOption} onPress={handleProfile}>
//               <MaterialIcons name="person" size={20} color="red" />
//               <Text style={styles.menuText}>Mi Perfil</Text>
//             </Pressable>
//             <Pressable style={styles.menuOption} onPress={handleLogout}>
//               <MaterialIcons name="logout" size={20} color="red" />
//               <Text style={[styles.menuText, { color: "red" }]}>
//                 Cerrar Sesión
//               </Text>
//             </Pressable>
//             <Pressable style={styles.closeMenuButton} onPress={closeMenu}>
//               <Text style={styles.closeMenuText}>Cancelar</Text>
//             </Pressable>
//           </View>
//         </View>
//       </Modal>

//       {/* Grid */}
//       <View style={styles.contentContainer}>
//         <Text style={styles.welcomeText}>¡Hola, Bienvenid@!</Text>
//         <Text style={styles.instructionText}>
//           ¡Selecciona la opción que deseas realizar!
//         </Text>
//         <View style={styles.gridContainer}>
//           {menuOptions.map((option) => (
//             <TouchableOpacity
//               key={option.id}
//               style={styles.card}
//               onPress={() => handleNavigation(option)}
//               activeOpacity={0.7}
//             >
//               {renderIcon(option)}
//               <Text style={styles.cardText}>{option.title}</Text>
//               <Text style={styles.cardDesc}>
//                 {option.id === "agenda" && "Eventos y citas"}
//                 {option.id === "tareas" && "Pendientes, completadas"}
//                 {option.id === "medicamentos" && "Dosis pendientes y tomadas"}
//                 {option.id === "compras" && "Registrar, eliminar compra"}
//                 {option.id === "reportes" && "Estadísticas y resúmenes"}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "beige" },
//   headerBar: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "red",
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     elevation: 4,
//   },
//   headerTitle: {
//     fontSize: FONT_SIZES.large,
//     fontWeight: "bold",
//     color: "white",
//     flex: 1,
//     textAlign: "center",
//   },
//   logo: {
//     width: 50,
//     height: 50,
//     borderRadius: 8,
//   },
//   iconButton: { padding: 8, borderRadius: 20 },
//   contentContainer: { flex: 1, paddingTop: 20 },
//   welcomeText: {
//     fontSize: FONT_SIZES.xlarge,
//     fontWeight: "bold",
//     color: "red",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   instructionText: {
//     fontSize: FONT_SIZES.medium,
//     color: "black",
//     textAlign: "center",
//     marginBottom: 30,
//   },
//   gridContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-around",
//     paddingHorizontal: 10,
//   },
//   card: {
//     width: "42%",
//     backgroundColor: "white",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 25,
//     paddingHorizontal: 15,
//     marginBottom: 15,
//     borderRadius: 12,
//     elevation: 3,
//   },
//   cardText: {
//     marginTop: 12,
//     fontSize: FONT_SIZES.medium,
//     fontWeight: "600",
//     color: "black",
//     textAlign: "center",
//   },
//   cardDesc: {
//     marginTop: 4,
//     fontSize: FONT_SIZES.small,
//     color: COLORS.textSecondary,
//     textAlign: "center",
//   },
//   menuOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   menuContainer: {
//     backgroundColor: "white",
//     padding: 20,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     minHeight: 200,
//   },
//   menuTitle: {
//     fontSize: FONT_SIZES.large,
//     fontWeight: "bold",
//     color: "black",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   menuOption: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//     borderRadius: 8,
//     marginBottom: 5,
//   },
//   menuText: {
//     fontSize: FONT_SIZES.medium,
//     color: "black",
//     marginLeft: 15,
//     fontWeight: "500",
//   },
//   closeMenuButton: {
//     alignSelf: "center",
//     marginTop: 15,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//   },
//   closeMenuText: {
//     fontSize: FONT_SIZES.medium,
//     color: "gray",
//     fontWeight: "500",
//   },
// });

// export default HomeScreen;

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { COLORS, FONT_SIZES } from "../../../types";

const HomeScreen = ({ navigation }: any) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const menuOptions = [
    {
      id: "agenda",
      title: "Agenda",
      icon: "calendar-alt",
      iconLibrary: "FontAwesome5",
      route: "AgendaScreen",
    },
    {
      id: "tareas",
      title: "Tareas",
      icon: "tasks",
      iconLibrary: "FontAwesome5",
      route: "TareasScreen",
    },
    {
      id: "medicamentos",
      title: "Medicamentos",
      icon: "pills",
      iconLibrary: "FontAwesome5",
      route: "MedicamentosScreen",
    },
    {
      id: "compras",
      title: "Compras",
      icon: "shopping-cart",
      iconLibrary: "FontAwesome5",
      route: "ComprasScreen",
    },
    {
      id: "reportes",
      title: "Reportes",
      icon: "bar-chart",
      iconLibrary: "MaterialIcons",
      route: "ReportesScreen",
    },
  ];

  const handleLogout = () => {
    setMenuVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  const handleProfile = () => {
    setMenuVisible(false);
    navigation.navigate("ProfileScreen");
  };

  const renderIcon = (option: any) => {
    const colors: any = {
      agenda: "#4CAF50",
      tareas: "#2196F3",
      medicamentos: "#FF9800",
      compras: "#9C27B0",
      reportes: "#F44336",
    };

    const iconProps = { size: 42, color: colors[option.id] };

    switch (option.iconLibrary) {
      case "FontAwesome5":
        return <FontAwesome5 name={option.icon} {...iconProps} />;
      case "MaterialIcons":
        return <MaterialIcons name={option.icon} {...iconProps} />;
      case "Entypo":
        return <Entypo name={option.icon} {...iconProps} />;
      default:
        return <MaterialIcons name="help-outline" {...iconProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="red" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.headerBar}>
        <Image
          source={require("../../../assets/login_image.png")}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Task&Life</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MaterialIcons name="menu" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Menú de Usuario</Text>

            <Pressable style={styles.menuOption} onPress={handleProfile}>
              <MaterialIcons name="person" size={20} color="red" />
              <Text style={styles.menuText}>Mi Perfil</Text>
            </Pressable>

            <Pressable style={styles.menuOption} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color="red" />
              <Text style={[styles.menuText, { color: "red" }]}>
                Cerrar Sesión
              </Text>
            </Pressable>

            <Pressable onPress={() => setMenuVisible(false)}>
              <Text style={styles.closeMenuText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CONTENIDO */}
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>¡Hola, Bienvenid@!</Text>
        <Text style={styles.instructionText}>
          ¡Selecciona la opción que deseas realizar!
        </Text>

        <View style={styles.gridContainer}>
          {menuOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(option.route)}
            >
              {renderIcon(option)}
              <Text style={styles.cardText}>{option.title}</Text>
              <Text style={styles.cardDesc}>
                {option.id === "agenda" && "Eventos y citas"}
                {option.id === "tareas" && "Pendientes y completadas"}
                {option.id === "medicamentos" && "Control de dosis"}
                {option.id === "compras" && "Registro de gastos"}
                {option.id === "reportes" && "Estadísticas"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

// ======================
// ESTILOS (TUS MISMOS)
// ======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "beige" },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "gray" },

  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "red",
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  logo: { width: 50, height: 50, borderRadius: 8 },

  contentContainer: { flex: 1, paddingTop: 20 },
  welcomeText: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: FONT_SIZES.medium,
    color: "black",
    textAlign: "center",
    marginBottom: 30,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  card: {
    width: "42%",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
  },
  cardText: {
    marginTop: 12,
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
  },
  cardDesc: {
    marginTop: 4,
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
  },
  menuTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  menuText: {
    fontSize: FONT_SIZES.medium,
    marginLeft: 15,
    fontWeight: "500",
  },
  closeMenuText: {
    textAlign: "center",
    marginTop: 15,
    color: "gray",
  },
});
