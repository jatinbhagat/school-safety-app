import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { getIncidents } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import { NetworkStatusBar } from '../utils/networkUtils';

export default function IncidentsList({ navigation }) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all, open, in_progress, resolved, assigned
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
    hasMore: true
  });

  // Add profile button to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, user]);

  const fetchIncidents = async (filter = activeFilter, search = searchQuery, reset = false) => {
    try {
      setError(null);
      
      // If reset, start from beginning
      const currentOffset = reset ? 0 : pagination.offset;
      setLoadingMore(!reset);

      // Build filter object
      const filters = {
        limit: pagination.limit,
        offset: currentOffset,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };
      
      if (filter === 'assigned') {
        filters.assignedToMe = true;
      } else if (filter !== 'all') {
        filters.status = filter;
      }
      
      if (search && search.trim()) {
        filters.search = search.trim();
      }

      const response = await getIncidents(filters);
      const newIncidents = response.incidents || response || [];
      const total = response.total || newIncidents.length;
      
      if (reset) {
        setIncidents(newIncidents);
      } else {
        setIncidents(prev => [...prev, ...newIncidents]);
      }
      
      setPagination(prev => ({
        ...prev,
        offset: currentOffset + newIncidents.length,
        total,
        hasMore: (currentOffset + newIncidents.length) < total
      }));
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
    fetchIncidents(activeFilter, searchQuery, true);
  }, [activeFilter]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
    fetchIncidents(activeFilter, searchQuery, true);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
    fetchIncidents(activeFilter, searchQuery, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchIncidents(activeFilter, searchQuery, false);
    }
  };

  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const renderIncident = ({ item }) => (
    <TouchableOpacity
      style={styles.incidentCard}
      onPress={() => navigation.navigate('IncidentDetail', { incidentId: item.id })}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentId}>#{item.id}</Text>
        <View style={[styles.statusBadge, getStatusColor(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.incidentTitle} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
      <Text style={styles.incidentMeta}>
        {item.category || item.type || 'General'}
        {item.ai_meta?.severity && ` | ${item.ai_meta.severity} severity`}
      </Text>
      <Text style={styles.incidentTime}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return styles.statusOpen;
      case 'in_progress':
        return styles.statusInProgress;
      case 'resolved':
        return styles.statusResolved;
      case 'closed':
        return styles.statusClosed;
      default:
        return styles.statusDefault;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchIncidents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <NetworkStatusBar />
      {/* Search Bar */}
      <SearchBar
        placeholder="Search incidents..."
        onSearch={handleSearch}
        debounceDelay={500}
        initialValue={searchQuery}
      />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => handleFilterPress('all')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'assigned' && styles.filterChipActive]}
          onPress={() => handleFilterPress('assigned')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'assigned' && styles.filterChipTextActive]}>
            Assigned to Me
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'open' && styles.filterChipActive]}
          onPress={() => handleFilterPress('open')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'open' && styles.filterChipTextActive]}>
            Open
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'in_progress' && styles.filterChipActive]}
          onPress={() => handleFilterPress('in_progress')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'in_progress' && styles.filterChipTextActive]}>
            In Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'resolved' && styles.filterChipActive]}
          onPress={() => handleFilterPress('resolved')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'resolved' && styles.filterChipTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Results Summary */}
      {!loading && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {incidents.length} of {pagination.total} incidents
            {searchQuery ? ` for "${searchQuery}"` : ''}
          </Text>
        </View>
      )}

      {/* Incidents List */}
      <FlatList
        data={incidents}
        renderItem={renderIncident}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No incidents match your search' : 'No incidents found'}
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  style={styles.clearSearchButton} 
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileButton: {
    marginRight: 12,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    maxHeight: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  incidentCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusOpen: {
    backgroundColor: '#FF9500',
  },
  statusInProgress: {
    backgroundColor: '#007AFF',
  },
  statusResolved: {
    backgroundColor: '#34C759',
  },
  statusClosed: {
    backgroundColor: '#8E8E93',
  },
  statusDefault: {
    backgroundColor: '#8E8E93',
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  incidentMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  incidentTime: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  clearSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
