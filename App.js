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
  const nuevasTareas = [...tareas, { id: Date.now().toString(), texto: tarea }];
  setTareas(nuevasTareas);
  guardarTareas(nuevasTareas);
  setTarea('');
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
        <Button title="Agregar" onPress={agregarTarea} />
      </View>
      <FlatList
        data={tareas}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.taskItem}>
            <Text>{[item.texto ]}</Text>
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
});
