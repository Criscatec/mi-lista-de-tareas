import React, {useState, useEffect} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, Button, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [tarea, setTarea] = useState('');
  const [tareas, setTareas] = useState([]);

const cargarTareas = async () => {
  try {
    const tareasGuardadas = await AsyncStorage.getItem('Tareas');
    if (tareasGuardadas) {
      setTareas(JSON.parse(tareasGuardadas));
    }
  } catch (error) {
    console.error('Error al cargar las tareas:', error);
  }
};

useEffect(() => {
  cargarTareas();
}, []);

const guardarTareas = async (nuevasTareas) => {
  try {
    await AsyncStorage.setItem('Tareas', JSON.stringify(nuevasTareas));
  } catch (error) {
    console.error('Error al guardar las tareas:', error);
  }
};

const agregarTarea = () => {
  if (tarea.trim() === '') return;
  const nuevasTareas = [...tareas, { id: Date.now().toString(), texto: tarea, completed: false }];
  setTareas(nuevasTareas);
  guardarTareas(nuevasTareas);
  setTarea('');
};

const toggleTareaCompletada = (id) => {
  const nuevasTareas = tareas.map(t => 
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  setTareas(nuevasTareas);
  guardarTareas(nuevasTareas);
};  

const eliminarTarea = (id) => {
  const nuevasTareas = tareas.filter(t => t.id !== id);
  setTareas(nuevasTareas);
  guardarTareas(nuevasTareas);
};

return (
    <View style={styles.container}>
      <Text style={{fontSize: 24, marginBottom: 16}}>Lista de Tareas</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Nueva tarea"
          value={tarea}
          onChangeText={setTarea}
        />
        <Button title="+" onPress={agregarTarea} />
      </View>
      <FlatList
        data={tareas}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.taskItem}>
            <Text
             style={[styles.taskItem, item.completed && styles.completedText]}
             onPress={() => toggleTareaCompletada(item.id)}
            >
              {item.texto}
              <View>
                {item.completed ? '✅' : '🟩'}
                <Button title="🗑️" onPress={() => eliminarTarea(item.id)} />
              </View>
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hay tareas.</Text>}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    flex: 1,
    marginRight: 8,
    borderRadius: 4,
  },
  taskItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: 300,
  },
  flatList: {
    width: '100%',
  },
  completedText: { 
    color: 'gray',
    textDecorationLine: 'line-through' 
  },
  boton: {
    borderRadius: 10,
    backgroundColor: '#fefef9b8',
    color: 'red',
    padding: 5,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
