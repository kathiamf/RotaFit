import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <GlassSurface
              style={StyleSheet.absoluteFill}
              radius={0}
              opacity={0.88}
              intensity={30}
            >
              <View style={StyleSheet.absoluteFill} />
            </GlassSurface>
          </View>
        ),
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'index'
              ? 'home-outline'
              : route.name === 'history'
                ? 'time-outline'
                : 'person-outline';
          return <Ionicons name={icon} size={size} color={String(color)} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="history" options={{ title: 'Histórico' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
  },
});
