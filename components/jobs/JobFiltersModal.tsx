import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { JobFilters } from '@/services/supabase/jobs';

interface JobFiltersModalProps {
  visible: boolean;
  filters: JobFilters;
  onApply: (filters: JobFilters) => void;
  onClose: () => void;
}

export const JobFiltersModal: React.FC<JobFiltersModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
}) => {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [localFilters, setLocalFilters] = useState<JobFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const countries = [
    'UK',
    'Germany',
    'Canada',
    'Netherlands',
    'Australia',
    'USA',
  ];
  const sectors = [
    'Technology',
    'Healthcare',
    'Engineering',
    'Finance',
    'Education',
  ];
  const visaOptions: ('YES' | 'NO' | 'UNKNOWN')[] = ['YES', 'NO', 'UNKNOWN'];

  const handleReset = () => {
    setLocalFilters({});
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Jobs</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Country Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Country</Text>
              <View style={styles.optionsRow}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.filterOption,
                      localFilters.country === country &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        country:
                          localFilters.country === country
                            ? undefined
                            : country,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        localFilters.country === country &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sector Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sector</Text>
              <View style={styles.optionsRow}>
                {sectors.map((sector) => (
                  <TouchableOpacity
                    key={sector}
                    style={[
                      styles.filterOption,
                      localFilters.sector === sector &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        sector:
                          localFilters.sector === sector ? undefined : sector,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        localFilters.sector === sector &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {sector}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Visa Sponsorship Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Visa Sponsorship</Text>
              <View style={styles.optionsRow}>
                {visaOptions.map((visa) => (
                  <TouchableOpacity
                    key={visa}
                    style={[
                      styles.filterOption,
                      localFilters.visaSponsorship === visa &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        visaSponsorship:
                          localFilters.visaSponsorship === visa
                            ? undefined
                            : visa,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        localFilters.visaSponsorship === visa &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {visa}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
    },
    closeButton: {
      fontSize: 24,
      color: c.textSecondary,
      fontWeight: '600',
    },
    filterGroup: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    filterLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 15,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    filterOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterOptionActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    filterOptionText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    filterOptionTextActive: {
      color: c.textPrimary,
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 15,
      padding: 20,
      paddingTop: 10,
    },
    resetButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textSecondary,
    },
    applyButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
    },
  });
