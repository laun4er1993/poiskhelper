// =====================================================
// src/hooks/useUIState.ts
// Всё UI-состояние приложения
// =====================================================

import { useState, useCallback, useMemo } from 'react';
import type { MeasurePoint } from '../types/measure';
import type { ClipboardData } from '../types/logs';

// -----------------------------------------------------
// Типы
// -----------------------------------------------------
export type ClickMode = 'select' | 'add-marker' | 'measure';

export interface PendingImport {
  fileName: string;
  objectCount: number;
  document: Document;
  sizeBytes: number;
}

export interface ToastData {
  text: string;
  label: string;
}

export interface LoadingState {
  visible: boolean;
  message: string;
  subMessage?: string;
  progress?: number | null;
  kind?: 'spinner' | 'progress' | 'success';
}

export interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  okLabel: string;
  cancelLabel: string;
  thirdLabel?: string;
  onThird?: () => void;
  danger: boolean;
  onConfirm: () => void;
}

export const DEFAULT_LOADING: LoadingState = {
  visible: false,
  message: '',
  kind: 'spinner',
};

export const DEFAULT_CONFIRM: ConfirmState = {
  visible: false,
  title: '',
  message: '',
  okLabel: 'ОК',
  cancelLabel: 'Отмена',
  danger: false,
  onConfirm: function () {},
};

// -----------------------------------------------------
// Результат
// -----------------------------------------------------
export interface UseUIStateResult {
  selectedIds: string[];
  lastClickedId: string | null;
  focusedId: string | null;
  focusedFolderId: string | null;
  activeFolderId: string;
  panelItemId: string | null;

  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setLastClickedId: React.Dispatch<React.SetStateAction<string | null>>;
  setFocusedId: React.Dispatch<React.SetStateAction<string | null>>;
  setFocusedFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveFolderId: (id: string) => void;
  setPanelItemId: React.Dispatch<React.SetStateAction<string | null>>;

  clickMode: ClickMode;
  setClickMode: React.Dispatch<React.SetStateAction<ClickMode>>;

  /**
   * @deprecated Эти поля НЕ используются GlobeViewer — там источник
   *   истины useMeasure. Оставлены только для совместимости с
   *   performResetProject(). Не добавлять новых использований.
   */
  measurePoints: MeasurePoint[];
  measureClosed: boolean;
  selectedMeasureIndex: number | null;
  setMeasurePoints: React.Dispatch<React.SetStateAction<MeasurePoint[]>>;
  setMeasureClosed: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedMeasureIndex: React.Dispatch<React.SetStateAction<number | null>>;

  clipboard: ClipboardData | null;
  setClipboard: React.Dispatch<React.SetStateAction<ClipboardData | null>>;

  dropTargetId: string | null;
  setDropTargetId: React.Dispatch<React.SetStateAction<string | null>>;

  previewOverrides: Record<string, Partial<any>>;
  setPreviewOverrides: React.Dispatch<
    React.SetStateAction<Record<string, Partial<any>>>
  >;

  showWelcome: boolean;
  setShowWelcome: React.Dispatch<React.SetStateAction<boolean>>;
  welcomeBusy: boolean;
  setWelcomeBusy: React.Dispatch<React.SetStateAction<boolean>>;
  welcomeBusyMessage: string;
  setWelcomeBusyMessage: React.Dispatch<React.SetStateAction<string>>;

  showProjectDetails: boolean;
  setShowProjectDetails: React.Dispatch<React.SetStateAction<boolean>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  showLogsPanel: boolean;
  setShowLogsPanel: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLogsPanel: () => void;

  infoDialogId: string | null;
  setInfoDialogId: React.Dispatch<React.SetStateAction<string | null>>;
  moveDialogIds: string[] | null;
  setMoveDialogIds: React.Dispatch<React.SetStateAction<string[] | null>>;
  pendingImport: PendingImport | null;
  setPendingImport: React.Dispatch<React.SetStateAction<PendingImport | null>>;

  confirmDialog: ConfirmState;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmState>>;
  closeConfirm: () => void;

  loading: LoadingState;
  setLoading: React.Dispatch<React.SetStateAction<LoadingState>>;
  closeLoading: () => void;

  appLoading: boolean;
  setAppLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loadingMessage: string;
  setLoadingMessage: React.Dispatch<React.SetStateAction<string>>;

  toast: ToastData | null;
  setToast: React.Dispatch<React.SetStateAction<ToastData | null>>;

  showSaveNotification: boolean;
  setShowSaveNotification: React.Dispatch<React.SetStateAction<boolean>>;
  saveNotificationHidden: boolean;
  setSaveNotificationHidden: React.Dispatch<React.SetStateAction<boolean>>;

  show3DBuildings: boolean;
  setShow3DBuildings: React.Dispatch<React.SetStateAction<boolean>>;
  buildingsLoading: boolean;
  setBuildingsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  clearSelection: () => void;
  closeAllDialogs: () => void;

  DEFAULT_CONFIRM: ConfirmState;
  DEFAULT_LOADING: LoadingState;
}

// -----------------------------------------------------
// Хук
// -----------------------------------------------------
export function useUIState(): UseUIStateResult {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusedFolderId, setFocusedFolderId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderIdState] =
    useState<string>('root-folder');
  const [panelItemId, setPanelItemId] = useState<string | null>(null);

  const [clickMode, setClickMode] = useState<ClickMode>('select');

  // @deprecated
  const [measurePoints, setMeasurePoints] = useState<MeasurePoint[]>([]);
  const [measureClosed, setMeasureClosed] = useState(false);
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState<
    number | null
  >(null);

  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [previewOverrides, setPreviewOverrides] = useState<
    Record<string, Partial<any>>
  >({});

  const [showWelcome, setShowWelcome] = useState<boolean>(function () {
    try {
      const raw = localStorage.getItem('poiskhelper_settings_v1');
      if (raw) {
        const s = JSON.parse(raw);
        return s.showWelcomeScreen !== false;
      }
    } catch (e) {}
    return true;
  });
  const [welcomeBusy, setWelcomeBusy] = useState(false);
  const [welcomeBusyMessage, setWelcomeBusyMessage] = useState(
    'Загрузка проекта...'
  );

  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogsPanel, setShowLogsPanel] = useState<boolean>(function () {
    try {
      const raw = localStorage.getItem('poiskhelper_logs_panel_v1');
      if (raw === 'true') return true;
    } catch (e) {}
    return false;
  });

  const [infoDialogId, setInfoDialogId] = useState<string | null>(null);
  const [moveDialogIds, setMoveDialogIds] = useState<string[] | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null
  );
  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmState>(DEFAULT_CONFIRM);

  const [loading, setLoading] = useState<LoadingState>(DEFAULT_LOADING);
  const [appLoading, setAppLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    'Инициализация приложения'
  );

  const [toast, setToast] = useState<ToastData | null>(null);

  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [saveNotificationHidden, setSaveNotificationHidden] = useState(false);

  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);

  const toggleLogsPanel = useCallback(function () {
    setShowLogsPanel(function (v) {
      const next = !v;
      try {
        localStorage.setItem('poiskhelper_logs_panel_v1', String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const setActiveFolderId = useCallback(function (id: string) {
    setActiveFolderIdState(id || 'root-folder');
  }, []);

  const closeConfirm = useCallback(function () {
    setConfirmDialog(DEFAULT_CONFIRM);
  }, []);

  const closeLoading = useCallback(function () {
    setLoading(DEFAULT_LOADING);
  }, []);

  const clearSelection = useCallback(function () {
    setSelectedIds([]);
    setLastClickedId(null);
    setPanelItemId(null);
  }, []);

  const closeAllDialogs = useCallback(function () {
    setConfirmDialog(DEFAULT_CONFIRM);
    setInfoDialogId(null);
    setMoveDialogIds(null);
    setPendingImport(null);
    setShowProjectDetails(false);
    setShowSettings(false);
    setShowLogsPanel(false);
    setLoading(DEFAULT_LOADING);
  }, []);

  return useMemo(
    function () {
      return {
        selectedIds,
        lastClickedId,
        focusedId,
        focusedFolderId,
        activeFolderId,
        panelItemId,
        setSelectedIds,
        setLastClickedId,
        setFocusedId,
        setFocusedFolderId,
        setActiveFolderId,
        setPanelItemId,

        clickMode,
        setClickMode,

        measurePoints,
        measureClosed,
        selectedMeasureIndex,
        setMeasurePoints,
        setMeasureClosed,
        setSelectedMeasureIndex,

        clipboard,
        setClipboard,

        dropTargetId,
        setDropTargetId,

        previewOverrides,
        setPreviewOverrides,

        showWelcome,
        setShowWelcome,
        welcomeBusy,
        setWelcomeBusy,
        welcomeBusyMessage,
        setWelcomeBusyMessage,

        showProjectDetails,
        setShowProjectDetails,
        showSettings,
        setShowSettings,
        showLogsPanel,
        setShowLogsPanel,
        toggleLogsPanel,

        infoDialogId,
        setInfoDialogId,
        moveDialogIds,
        setMoveDialogIds,
        pendingImport,
        setPendingImport,

        confirmDialog,
        setConfirmDialog,
        closeConfirm,

        loading,
        setLoading,
        closeLoading,

        appLoading,
        setAppLoading,
        loadingMessage,
        setLoadingMessage,

        toast,
        setToast,

        showSaveNotification,
        setShowSaveNotification,
        saveNotificationHidden,
        setSaveNotificationHidden,

        show3DBuildings,
        setShow3DBuildings,
        buildingsLoading,
        setBuildingsLoading,

        clearSelection,
        closeAllDialogs,

        DEFAULT_CONFIRM,
        DEFAULT_LOADING,
      };
    },
    [
      selectedIds,
      lastClickedId,
      focusedId,
      focusedFolderId,
      activeFolderId,
      panelItemId,
      clickMode,
      measurePoints,
      measureClosed,
      selectedMeasureIndex,
      clipboard,
      dropTargetId,
      previewOverrides,
      showWelcome,
      welcomeBusy,
      welcomeBusyMessage,
      showProjectDetails,
      showSettings,
      showLogsPanel,
      infoDialogId,
      moveDialogIds,
      pendingImport,
      confirmDialog,
      loading,
      appLoading,
      loadingMessage,
      toast,
      showSaveNotification,
      saveNotificationHidden,
      show3DBuildings,
      buildingsLoading,
      toggleLogsPanel,
      setActiveFolderId,
      closeConfirm,
      closeLoading,
      clearSelection,
      closeAllDialogs,
    ]
  );
}