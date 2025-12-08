import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useDebouncedSearch } from '../utils/debounce';

/**
 * Reusable search bar component with debouncing
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder text
 * @param {Function} props.onSearch - Callback with search term
 * @param {number} props.debounceDelay - Debounce delay in ms (default: 300)
 * @param {string} props.initialValue - Initial search value
 * @param {boolean} props.autoFocus - Whether to auto focus (default: false)
 * @param {Function} props.onFocus - Focus callback
 * @param {Function} props.onBlur - Blur callback
 */
export default function SearchBar({
  placeholder = 'Search...',
  onSearch,
  debounceDelay = 300,
  initialValue = '',
  autoFocus = false,
  onFocus,
  onBlur,
  style,
}) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Use debounced search hook
  useDebouncedSearch(searchTerm, onSearch, debounceDelay);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.searchInput,
        isFocused && styles.searchInputFocused
      ]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
        />
        {Platform.OS === 'android' && searchTerm.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={clearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 40,
  },
  searchInputFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    color: '#999',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
});