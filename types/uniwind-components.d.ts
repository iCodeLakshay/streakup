import type {
  View as RNView,
  Text as RNText,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  FlatList as RNFlatList,
  Image as RNImage,
  PressableProps,
} from 'react-native';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

declare module 'uniwind/components' {
  export const View: typeof RNView;
  export const Text: typeof RNText;
  export const Pressable: ForwardRefExoticComponent<PressableProps & RefAttributes<RNView>>;
  export const ScrollView: typeof RNScrollView;
  export const TextInput: typeof RNTextInput;
  export const TouchableOpacity: typeof RNTouchableOpacity;
  export const FlatList: typeof RNFlatList;
  export const Image: typeof RNImage;
}
