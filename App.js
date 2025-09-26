import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,  
  SectionList,
  Modal,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Alert, // Importamos Alert para las confirmaciones
  Platform, // Importamos Platform para detectar si es web o móvil
  LayoutAnimation, 
  UIManager, // Para animaciones automáticas
  Image // Para mostrar el ícono del clima
} from 'react-native';
// Importamos los íconos que acabamos de instalar
import { Feather, MaterialIcons } from '@expo/vector-icons';
// Importamos AsyncStorage para guardar las tareas
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importamos el módulo de localización
import * as Location from 'expo-location';

const TASKS_STORAGE_KEY = '@todoList:tasks';
const API_KEY = '3c51cdeb2302eda8fcb5d2b30b7f1cfe'; //  API Key

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  
  // --- Estados para el clima ---
  const [weather, setWeather] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // --- Cargar tareas al iniciar la app ---
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
        if (storedTasks !== null) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (error) {
        console.error("Error al cargar las tareas", error);
      }
    };
    loadTasks();
  }, []);

  // --- Cargar ubicación y clima al iniciar la app ---
  useEffect(() => {
    const fetchWeather = async () => {
      // 1. Pedir permiso para acceder a la ubicación
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('El permiso para acceder a la ubicación fue denegado');
        return;
      }

      try {
        // 2. Obtener la ubicación actual
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // 3. Llamar a la API de OpenWeatherMap
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=es`
        );
        const data = await response.json();
        
        if (response.ok) {
          setWeather(data);
        } else {
          setLocationError('No se pudo obtener el clima.');
        }
      } catch (error) {
        setLocationError('Error al obtener la ubicación o el clima.');
      }
    };

    fetchWeather();
  }, []);

  // --- Guardar tareas cada vez que cambian ---
  useEffect(() => {
    const saveTasks = async () => {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    };
    saveTasks();
  }, [tasks]);
  
  // --- Estados para la edición ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // Guarda la tarea que se está editando
  const [editedText, setEditedText] = useState(''); // Guarda el nuevo texto de la tarea

  // Función para añadir una nueva tarea
  const handleAddTask = () => {
    if (task.trim() === '') return; // No añadir tareas vacías
    setTasks([...tasks, { id: Date.now().toString(), text: task, isCompleted: false, completedAt: null }]);
    setTask('');
    Keyboard.dismiss(); // Oculta el teclado
  };

  // Función para eliminar una tarea
  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // --- Función para marcar una tarea como completada ---
  const handleToggleComplete = (taskToComplete) => {
    // Configura la animación antes de que el estado cambie
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Lógica para actualizar el estado de la tarea
    const completeTask = () => {
      setTasks(tasks.map(t => 
        t.id === taskToComplete.id 
          ? { ...t, 
              isCompleted: true, 
              completedAt: new Date().toLocaleString('es-ES') // Guarda fecha y hora local
            } 
          : t
      ));
    };

    // Usamos una confirmación diferente para la web
    if (Platform.OS === 'web') {
      const shouldComplete = window.confirm("¿Estás seguro de que quieres marcar esta tarea como completada?");
      if (shouldComplete) {
        completeTask();
      }
    } else {
      // La alerta nativa para iOS y Android
      Alert.alert(
        "Completar Tarea",
        "¿Estás seguro de que quieres marcar esta tarea como completada?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sí, completar", onPress: completeTask }
        ]
      );
    }
  };

  // --- Funciones para la edición ---

  // 1. Abre el modal de edición y carga los datos de la tarea
  const handleStartEditing = (taskToEdit) => {
    setEditingTask(taskToEdit);
    setEditedText(taskToEdit.text);
    setEditModalVisible(true);
  };

  // 2. Guarda los cambios de la tarea editada
  const handleSaveEdit = () => {
    if (editedText.trim() === '') return;
    
    setTasks(tasks.map(t => 
      t.id === editingTask.id ? { ...t, text: editedText } : t
    ));
    
    setEditModalVisible(false);
    setEditingTask(null);
  };

  // 3. Cierra el modal sin guardar
  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingTask(null);
  };


  // Componente para renderizar cada tarea en la lista
  const renderItem = ({ item }) => (
    <View style={[styles.taskCard, item.isCompleted && styles.completedTaskCard]}>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskText, item.isCompleted && styles.completedTaskText]}>
          {item.text}
        </Text>
        {item.isCompleted && item.completedAt && (
          <Text style={styles.completionTimeText}>
            Completado: {item.completedAt}
          </Text>
        )}
      </View>
      <View style={styles.taskActions}>
        {!item.isCompleted && (
          <TouchableOpacity onPress={() => handleToggleComplete(item)}>
            <Feather name="check-square" size={22} color="#28a745" />
          </TouchableOpacity>
        )}
        {!item.isCompleted && (
          <TouchableOpacity onPress={() => handleStartEditing(item)}>
            <Feather name="edit" size={22} color="#4a90e2" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDeleteTask(item.id)} >
          <Feather name="trash-2" size={22} color="#e94560" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Separamos las tareas en pendientes y completadas
  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <Text style={styles.title}>Mi Lista de Tareas</Text>

      {/* --- Tarjeta del Clima --- */}
      <View style={styles.weatherCard}>
        {locationError ? (
          <Text style={styles.weatherText}>{locationError}</Text>
        ) : weather ? (
          <>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherCity}>{weather.name}</Text>
              <Text style={styles.weatherDescription}>{weather.weather[0].description}</Text>
            </View>
            <View style={styles.weatherTempContainer}>
              <Image
                source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png` }}
                style={styles.weatherIcon}
              />
              <Text style={styles.weatherTemp}>{Math.round(weather.main.temp)}°C</Text>
            </View>
          </>
        ) : (
          <Text style={styles.weatherText}>Cargando clima...</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Añadir una nueva tarea..."
          placeholderTextColor="#888"
          value={task}
          onChangeText={setTask}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Usamos SectionList para un rendimiento y estructura óptimos */}
      <SectionList
        sections={[
          { title: `Pendientes (${pendingTasks.length})`, data: pendingTasks },
          { title: `Completadas (${completedTasks.length})`, data: completedTasks },
        ]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title, data } }) => (
          // No mostrar el título de la sección si no tiene items
          data.length > 0 ? <Text style={styles.sectionTitle}>{title}</Text> : null
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>¡No hay tareas! Añade una para empezar.</Text>
        }
      />

      {/* --- Modal para Editar Tarea --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={handleCancelEdit}
      >
        <TouchableWithoutFeedback onPress={handleCancelEdit}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Tarea</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editedText}
                            onChangeText={setEditedText}
                            autoFocus={true}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancelEdit}>
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit}>
                                <Text style={styles.modalButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// --- Hoja de Estilo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Fondo oscuro
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 20,
    textAlign: 'center',
  },
  // --- Estilos para la tarjeta del clima ---
  weatherCard: {
    backgroundColor: '#2c2c54',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherCity: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  weatherDescription: {
    color: '#b0b0b0',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  weatherTempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
  weatherTemp: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  weatherText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#a0a0a0',
    marginTop: 20,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#2c2c54',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4a90e2', 
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  // Estilo de la cart para cada tarea
  taskCard: {
    backgroundColor: '#2c2c54',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    // Sombra para darle efecto de "card"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Estilo para la card de tarea completada
  completedTaskCard: {
    backgroundColor: '#252540',
    borderColor: '#4a90e2',
  },
  taskInfo: {
    flex: 1,
  },
  taskText: {
    color: '#e0e0e0',
    fontSize: 16,
  },
  // Estilo para el texto de la tarea completada
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  // Estilo para la hora de completado
  completionTimeText: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15, // Añade un espacio de 15px entre cada botón
  },
  emptyListText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  // Estilos para el Modal de edición
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c2c54',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  modalInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
