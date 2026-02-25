import { useColorScheme as usePossibleScheme } from 'react-native';


export function useColorScheme() {
    return usePossibleScheme() ?? "light"
}