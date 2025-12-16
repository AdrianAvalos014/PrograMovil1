/**
 * Archivo central para todos los tipos TypeScript de la aplicación
 * Aquí definimos las interfaces y tipos que se usarán en toda la app
 */
// ==========================================
// TIPOS BÁSICOS DE LA APLICACIÓN
// ==========================================
/**
 * Tipo para identificadores únicos
 */
export type ID = number;
/**
 * Carreras disponibles en el sistema
 */
export type Carrera = "ISC" | "IGE" | "IIA" | "ITICS";
// ==========================================
// INTERFACES DE ENTIDADES PRINCIPALES
// ==========================================
/**
 * Interfaz base para entidades que tienen ID
 */
export interface BaseEntity {
  id: ID;
}
/**
 * Interfaz para un Alumno
 */
export interface Alumno extends BaseEntity {
  id: number;
  nombre: string;
  sem?: string; // Semestre (ej: "7A", "8B")
  carrera?: Carrera;
  email?: string;
  telefono?: string;
}
/**
 * Interfaz para un Profesor
 */
export interface Profesor extends BaseEntity {
  nombre: string;
  carrera: Carrera;
  email?: string;
  telefono?: string;
  especialidad?: string;
}
/**
 * Interfaz para una Materia
 */
export interface Materia extends BaseEntity {
  nombre: string;
  carrera: Carrera;
  creditos?: number;
  semestre?: number;
  descripcion?: string;
}
/**
 * Interfaz para un Grupo
 */
export interface Grupo extends BaseEntity {
  nombre: string;
  carrera: Carrera;
  profesorId?: ID;
  materiaId?: ID;
  alumnos?: Alumno[];
  horario?: string;
}
// ==========================================
// TIPOS PARA COMPONENTES UI
// ==========================================
/**
 * Props para componentes de Card/Tarjeta
 */
export interface CardProps {
  titulo: string;
  subtitulo?: string;
  onPress?: () => void;
  icono?: string;
  imagen?: any; // Para require() de imágenes
}
/**
 * Props para componentes de Modal
 */
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  titulo?: string;
  children?: React.ReactNode;
}
/**
 * Props para componentes de Lista
 */
export interface ListItemProps<T> {
  item: T;
  onPress?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}
// ==========================================
// TIPOS PARA FORMULARIOS
// ==========================================
/**
 * Datos del formulario de Login
 */
export interface LoginFormData {
  username: string;
  password: string;
}
/**
 * Datos del formulario de Alumno
 */
export interface AlumnoFormData {
  nombre: string;
  sem: string;
  carrera?: Carrera;
  email?: string;
  telefono?: string;
}
/**
 * Datos del formulario de Profesor
 */
export interface ProfesorFormData {
  nombre: string;
  carrera: Carrera;
  email?: string;
  telefono?: string;
  especialidad?: string;
}
// ==========================================
// TIPOS PARA GESTIÓN DE ESTADOS
// ==========================================
/**
 * Estados de carga para operaciones asíncronas
 */
export type LoadingState = "idle" | "loading" | "success" | "error";
/**
 * Estructura para manejo de errores
 */
export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}
/**
 * Estado general de una pantalla con datos
 */
export interface ScreenState<T> {
  data: T[];
  loading: LoadingState;
  error: ErrorState;
}
// ==========================================
// TIPOS PARA NAVEGACIÓN (Complementarios)
// ==========================================
/**
 * Props que reciben las pantallas de navegación
 */
export interface ScreenProps<T = any> {
  navigation: any; // Tipo básico, se puede mejorar después
  route: {
    params?: T;
  };
}
/**
 * Parámetros específicos para pantallas de detalle
 */
export interface DetailScreenParams {
  id: ID;
  nombre: string;
}
// ==========================================
// TIPOS UTILITARIOS
// ==========================================
/**
 * Hace todas las propiedades opcionales excepto el ID
 */
export type PartialExceptId<T extends BaseEntity> = {
  id: ID;
} & Partial<Omit<T, "id">>;
/**
 * Omite el ID para crear nuevos elementos
 */
export type CreateEntity<T extends BaseEntity> = Omit<T, "id">;
/**
 * Para operaciones CRUD
 */
export type CRUDOperation = "create" | "read" | "update" | "delete";
// ==========================================
// CONSTANTES DE TIPO
// ==========================================
/**
 * Colores principales de la aplicación
 */
export const COLORS = {
  primary: "#49c75eff",
  secondary: "#03dac6",
  background: "#f5f5f5",
  surface: "#ffffff",
  error: "#b00020",
  text: "#000000",
  textSecondary: "#777777",
};
/**
 * Tamaños de fuente estándar
 */
export const FONT_SIZES = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 22,
  xxlarge: 24,
};