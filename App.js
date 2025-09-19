import React, {useState, useEffect} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, Button, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function App() {
  const [tarea, setTarea] = useState('');
  const [tareas, setTareas] = useState([]);

  const CargarTareas = async () => {
  try {
    const tareasGuardadas = await AsyncStorage.getItem('Tareas');
    if (tareasGuardadas) {
      setTareas(JSON.parse(tareasGuardadas));
    }
  } catch (error) {
    console.error('Error al cargar las tareas:', error);
  }
  }
};

const GuardarTareas = async (nuevasTareas) => {
  try {
    await AsyncStorage.setItem('Tareas', JSON.stringify(nuevasTareas));
  } catch (error) {
    console.error('Error al guardar las tareas:', error);
  }
};
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
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
});
