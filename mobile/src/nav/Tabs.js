import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand[900],
        tabBarActiveBackgroundColor: colors.brand[100],
        tabBarInactiveTintColor: colors.ink[400],
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          const map = { Beranda: 'home', Profil: 'person' };
          return <Ionicons name={map[route.name] || 'ellipse'} size={size} color={color} />;
        },
        tabBarAccessibilityLabel: route.name,
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Profil" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
