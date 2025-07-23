import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  FlatList,
} from "react-native";
import { useColors } from "../utils/colors";
import { apiService } from "../services/api";
import Icon from "react-native-vector-icons/MaterialIcons";

interface GitDiffLine {
  type: "context" | "addition" | "deletion";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
  header: string;
}

interface GitDiff {
  filePath: string;
  oldPath?: string;
  hunks: GitDiffHunk[];
  isNew: boolean;
  isDeleted: boolean;
  isBinary: boolean;
}

interface FileDiffModalProps {
  visible: boolean;
  onClose: () => void;
  repositoryPath: string;
  filePath: string;
  fileStatus: "modified" | "added" | "deleted" | "untracked";
  staged: boolean;
}

export const FileDiffModal: React.FC<FileDiffModalProps> = ({
  visible,
  onClose,
  repositoryPath,
  filePath,
  fileStatus,
  staged,
}) => {
  const colors = useColors();
  const [diff, setDiff] = useState<GitDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ additions: number; deletions: number }>({
    additions: 0,
    deletions: 0,
  });

  useEffect(() => {
    if (visible && repositoryPath && filePath) {
      loadFileDiff();
    }
  }, [visible, repositoryPath, filePath, staged]);

  const loadFileDiff = async () => {
    if (!repositoryPath || !filePath) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading diff for:", {
        repositoryPath,
        filePath,
        staged,
        fileStatus,
      });

      // Handle special cases first
      if (fileStatus === "untracked") {
        console.log("📝 Untracked file - loading file contents for diff view");
        try {
          const contentsResponse = await apiService.getFileContents(
            repositoryPath,
            filePath
          );

          if (contentsResponse.success && contentsResponse.data?.contents) {
            console.log("✅ File contents loaded for untracked file");
            const contents = contentsResponse.data.contents;

            // Create a diff-like structure for the new file
            const lines = contents.split("\n");
            const diffLines: GitDiffLine[] = lines.map((line, index) => ({
              type: "addition" as const,
              content: line,
              oldLineNumber: undefined,
              newLineNumber: index + 1,
            }));

            const newFileDiff: GitDiff = {
              filePath,
              hunks: [
                {
                  oldStart: 0,
                  oldLines: 0,
                  newStart: 1,
                  newLines: lines.length,
                  lines: diffLines,
                  header: `@@ -0,0 +1,${lines.length} @@`,
                },
              ],
              isNew: true,
              isDeleted: false,
              isBinary: false,
            };

            setDiff(newFileDiff);

            // Calculate stats
            setStats({ additions: lines.length, deletions: 0 });
          } else {
            console.log("⚠️ Failed to load file contents");
            setError("Failed to load file contents");
          }
        } catch (error) {
          console.error("❌ Error loading file contents:", error);
          setError("Failed to load file contents");
        }
        setLoading(false);
        return;
      }

      if (fileStatus === "deleted") {
        console.log("📝 Deleted file - showing deleted file state");
        setDiff({
          filePath,
          hunks: [],
          isNew: false,
          isDeleted: true,
          isBinary: false,
        });
        setLoading(false);
        return;
      }

      const response = await apiService.getFileDiff(
        repositoryPath,
        filePath,
        staged
      );

      console.log("📝 Diff response:", response);

      if (response.success && response.data) {
        console.log("📊 Response data:", response.data);

        // Check if diffs array exists and has content
        if (
          response.data.diffs &&
          Array.isArray(response.data.diffs) &&
          response.data.diffs.length > 0
        ) {
          const diffItem = response.data.diffs[0];
          console.log("📋 Diff item:", diffItem);

          // The backend returns the diff data nested under a 'diff' property
          const diffData = diffItem.diff || diffItem;
          console.log("📋 Actual diff data:", diffData);

          if (diffData && diffData.hunks) {
            console.log("✅ Valid diff data found, setting diff");
            setDiff(diffData);

            // Calculate stats
            let additions = 0;
            let deletions = 0;
            if (diffData.hunks && Array.isArray(diffData.hunks)) {
              console.log(`📊 Processing ${diffData.hunks.length} hunks`);
              diffData.hunks.forEach((hunk: GitDiffHunk, index: number) => {
                if (hunk.lines && Array.isArray(hunk.lines)) {
                  console.log(
                    `📝 Hunk ${index + 1}: ${hunk.lines.length} lines`
                  );
                  hunk.lines.forEach((line: GitDiffLine) => {
                    if (line.type === "addition") additions++;
                    if (line.type === "deletion") deletions++;
                  });
                }
              });
            }
            console.log(`📈 Stats: +${additions} -${deletions}`);
            setStats({ additions, deletions });
          } else {
            console.log("⚠️ No valid diff data found in response");
            console.log("📋 Diff data structure:", diffData);
            setError("No valid diff data found");
          }
        } else {
          console.log("⚠️ No diffs found in response");
          // For new files, we might not get a diff
          if (fileStatus === "added") {
            setDiff({
              filePath,
              hunks: [],
              isNew: true,
              isDeleted: false,
              isBinary: false,
            });
          } else {
            setError("No changes found for this file");
          }
        }
      } else {
        console.log("❌ API request failed:", response.error);
        setError(response.error || "Failed to load file diff");
      }
    } catch (error) {
      console.error("❌ Error loading file diff:", error);
      setError("Failed to load file diff");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "modified":
        return "edit";
      case "added":
        return "add";
      case "deleted":
        return "remove";
      case "untracked":
        return "add-circle-outline";
      default:
        return "description";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "modified":
        return colors.primary;
      case "added":
        return "#4caf50";
      case "deleted":
        return colors.error;
      case "untracked":
        return colors.textSecondary;
      default:
        return colors.text;
    }
  };

  const renderDiffLine = ({ item }: { item: GitDiffLine }) => {
    const lineStyle = [
      styles.diffLine,
      {
        backgroundColor:
          item.type === "addition"
            ? "rgba(76, 175, 80, 0.1)"
            : item.type === "deletion"
              ? "rgba(244, 67, 54, 0.1)"
              : "transparent",
      },
    ];

    const lineNumberStyle = [
      styles.lineNumber,
      {
        color:
          item.type === "addition"
            ? "#4caf50"
            : item.type === "deletion"
              ? colors.error
              : colors.textSecondary,
      },
    ];

    const lineContentStyle = [
      styles.lineContent,
      {
        color:
          item.type === "addition"
            ? "#4caf50"
            : item.type === "deletion"
              ? colors.error
              : colors.text,
      },
    ];

    const getLinePrefix = () => {
      switch (item.type) {
        case "addition":
          return "+";
        case "deletion":
          return "-";
        default:
          return " ";
      }
    };

    return (
      <View style={lineStyle}>
        <Text style={lineNumberStyle}>
          {item.oldLineNumber !== undefined ? item.oldLineNumber : " "}
        </Text>
        <Text style={lineNumberStyle}>
          {item.newLineNumber !== undefined ? item.newLineNumber : " "}
        </Text>
        <Text
          style={[
            styles.linePrefix,
            {
              color:
                item.type === "addition"
                  ? "#4caf50"
                  : item.type === "deletion"
                    ? colors.error
                    : colors.textSecondary,
            },
          ]}
        >
          {getLinePrefix()}
        </Text>
        <Text style={lineContentStyle} numberOfLines={1}>
          {item.content}
        </Text>
      </View>
    );
  };

  const renderHunk = ({ item }: { item: GitDiffHunk }) => (
    <View key={`hunk-${item.oldStart}-${item.newStart}`} style={styles.hunk}>
      <View style={[styles.hunkHeader, { backgroundColor: colors.card }]}>
        <Text style={[styles.hunkHeaderText, { color: colors.textSecondary }]}>
          {item.header}
        </Text>
      </View>
      <FlatList
        data={item.lines}
        renderItem={renderDiffLine}
        keyExtractor={(line, index) => `${line.content}-${index}`}
        scrollEnabled={false}
      />
    </View>
  );

  const renderEmptyState = () => {
    if (fileStatus === "added") {
      return (
        <View style={styles.emptyState}>
          <Icon name='add-circle' size={48} color='#4caf50' />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            New File
          </Text>
          <Text
            style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}
          >
            This is a new file that will be created
          </Text>
        </View>
      );
    }

    if (fileStatus === "deleted") {
      return (
        <View style={styles.emptyState}>
          <Icon name='delete' size={48} color={colors.error} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            File Deleted
          </Text>
          <Text
            style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}
          >
            This file will be removed
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Icon name='info' size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          No Changes
        </Text>
        <Text
          style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}
        >
          No changes found for this file
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <View style={styles.headerLeft}>
              <Icon
                name={getStatusIcon(fileStatus)}
                size={20}
                color={getStatusColor(fileStatus)}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {filePath}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name='close' size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.fileInfo}>
            <View style={styles.fileStatusBadge}>
              <Text
                style={[
                  styles.fileStatusText,
                  { color: getStatusColor(fileStatus) },
                ]}
              >
                {fileStatus}
              </Text>
            </View>
            {staged && (
              <View
                style={[
                  styles.stagedBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.stagedText}>Staged</Text>
              </View>
            )}
          </View>

          {/* Stats Summary */}
          {diff && diff.hunks.length > 0 && (
            <View
              style={[styles.statsContainer, { backgroundColor: colors.card }]}
            >
              <View style={styles.statItem}>
                <Icon name='add' size={16} color='#4caf50' />
                <Text style={[styles.statText, { color: "#4caf50" }]}>
                  +{stats.additions}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name='remove' size={16} color={colors.error} />
                <Text style={[styles.statText, { color: colors.error }]}>
                  -{stats.deletions}
                </Text>
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading diff...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Icon name='error' size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.text }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={loadFileDiff}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : diff && diff.hunks.length > 0 ? (
            <ScrollView style={styles.diffContainer}>
              <FlatList
                data={diff.hunks}
                renderItem={renderHunk}
                keyExtractor={(hunk) => `${hunk.oldStart}-${hunk.newStart}`}
                scrollEnabled={false}
              />
            </ScrollView>
          ) : (
            <ScrollView style={styles.diffContainer}>
              {renderEmptyState()}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    height: "90%",
    borderRadius: 12,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  fileStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  fileStatusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  stagedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stagedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  diffContainer: {
    flex: 1,
  },
  hunk: {
    marginBottom: 8,
  },
  hunkHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  hunkHeaderText: {
    fontSize: 12,
    fontFamily: "Menlo",
  },
  diffLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 2,
    minHeight: 20,
  },
  lineNumber: {
    width: 40,
    fontSize: 12,
    fontFamily: "Menlo",
    textAlign: "right",
    marginRight: 8,
  },
  linePrefix: {
    width: 20,
    fontSize: 12,
    fontFamily: "Menlo",
    textAlign: "center",
    marginRight: 8,
  },
  lineContent: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Menlo",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
