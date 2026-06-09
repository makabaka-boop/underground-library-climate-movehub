import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { Add, Warning, CheckCircle, Info } from '@mui/icons-material';
import { getInspectionRecords, createInspectionRecord, getBookshelves, getStorageAreas } from '../api';

const moldLevelOptions = [
  { value: 0, label: '无' },
  { value: 1, label: '轻微' },
  { value: 2, label: '中等' },
  { value: 3, label: '严重' },
];

const HUMIDITY_THRESHOLD = 60;
const MOLD_LEVEL_THRESHOLD = 2;

const evaluateRisk = (record) => {
  const risks = [];
  if (record.humidity > HUMIDITY_THRESHOLD) {
    risks.push(`湿度超标（${record.humidity}%）`);
  }
  if (record.mold_level >= MOLD_LEVEL_THRESHOLD) {
    risks.push(`霉斑等级较高（${record.mold_level}级）`);
  }
  if (record.has_odor) {
    risks.push('存在异味');
  }
  if (record.has_pest) {
    risks.push('发现虫害痕迹');
  }
  return {
    hasRisk: risks.length > 0,
    riskCount: risks.length,
    riskDescription: risks.join('；'),
  };
};

const InspectionRecords = () => {
  const [records, setRecords] = useState([]);
  const [bookshelves, setBookshelves] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    bookshelf_id: '',
    temperature: 20,
    humidity: 50,
    has_odor: false,
    mold_level: 0,
    has_pest: false,
    handling_notes: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
    loadBookshelves();
    loadStorageAreas();
  }, []);

  const loadData = async () => {
    try {
      const data = await getInspectionRecords();
      setRecords(data);
    } catch (error) {
      showSnackbar('加载数据失败', 'error');
    }
  };

  const loadBookshelves = async () => {
    try {
      const data = await getBookshelves();
      setBookshelves(data);
    } catch (error) {
      console.error('Failed to load bookshelves:', error);
    }
  };

  const loadStorageAreas = async () => {
    try {
      const data = await getStorageAreas();
      setStorageAreas(data);
    } catch (error) {
      console.error('Failed to load storage areas:', error);
    }
  };

  const getBookshelfArea = (bookshelfId) => {
    const shelf = bookshelves.find((b) => b.id === bookshelfId);
    if (shelf) {
      const area = storageAreas.find((a) => a.id === shelf.storage_area_id);
      return area ? area.name : '-';
    }
    return '-';
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpen = () => {
    setFormData({
      bookshelf_id: bookshelves[0]?.id || '',
      temperature: 20,
      humidity: 50,
      has_odor: false,
      mold_level: 0,
      has_pest: false,
      handling_notes: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    try {
      await createInspectionRecord(formData);
      showSnackbar('创建成功', 'success');
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const getMoldLevelLabel = (level) => {
    const option = moldLevelOptions.find((o) => o.value === level);
    return option ? option.label : level;
  };

  const getMoldLevelColor = (level) => {
    if (level === 0) return 'success';
    if (level === 1) return 'default';
    if (level === 2) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">巡检记录</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          新增巡检记录
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>书架</TableCell>
                <TableCell>所属库区</TableCell>
                <TableCell>温度 (°C)</TableCell>
                <TableCell>湿度 (%)</TableCell>
                <TableCell>异味</TableCell>
                <TableCell>霉斑等级</TableCell>
                <TableCell>虫害</TableCell>
                <TableCell>风险状态</TableCell>
                <TableCell>风险说明</TableCell>
                <TableCell>处理备注</TableCell>
                <TableCell>巡检时间</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => {
                const risk = evaluateRisk(record);
                return (
                  <TableRow key={record.id} sx={{ bgcolor: risk.hasRisk ? 'error.lighter' : 'inherit' }}>
                    <TableCell>{bookshelves.find((b) => b.id === record.bookshelf_id)?.code || '-'}</TableCell>
                    <TableCell>{getBookshelfArea(record.bookshelf_id)}</TableCell>
                    <TableCell>{record.temperature}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${record.humidity}%`}
                        size="small"
                        color={record.humidity > HUMIDITY_THRESHOLD ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={record.has_odor ? '有' : '无'} size="small" color={record.has_odor ? 'warning' : 'success'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={getMoldLevelLabel(record.mold_level)} size="small" color={getMoldLevelColor(record.mold_level)} />
                    </TableCell>
                    <TableCell>
                      <Chip label={record.has_pest ? '有' : '无'} size="small" color={record.has_pest ? 'error' : 'success'} />
                    </TableCell>
                    <TableCell>
                      {risk.hasRisk ? (
                        <Chip
                          icon={<Warning />}
                          label={`${risk.riskCount}项风险`}
                          size="small"
                          color="error"
                        />
                      ) : (
                        <Chip
                          icon={<CheckCircle />}
                          label="正常"
                          size="small"
                          color="success"
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      {risk.hasRisk ? (
                        <MuiTooltip title={risk.riskDescription}>
                          <Typography variant="body2" noWrap color="error">
                            {risk.riskDescription}
                          </Typography>
                        </MuiTooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{record.handling_notes || '-'}</TableCell>
                    <TableCell>{new Date(record.inspection_time).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>新增巡检记录</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="书架"
              value={formData.bookshelf_id}
              onChange={(e) => setFormData({ ...formData, bookshelf_id: parseInt(e.target.value) })}
              fullWidth
              required
            >
              {bookshelves.map((shelf) => (
                <MenuItem key={shelf.id} value={shelf.id}>
                  {shelf.code} - {shelf.name}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="温度 (°C)"
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                fullWidth
                required
                inputProps={{ min: -20, max: 50, step: 0.1 }}
              />
              <TextField
                label="湿度 (%)"
                type="number"
                value={formData.humidity}
                onChange={(e) => setFormData({ ...formData, humidity: parseFloat(e.target.value) || 0 })}
                fullWidth
                required
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Box>
            <TextField
              select
              label="霉斑等级"
              value={formData.mold_level}
              onChange={(e) => setFormData({ ...formData, mold_level: parseInt(e.target.value) })}
              fullWidth
            >
              {moldLevelOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_odor}
                    onChange={(e) => setFormData({ ...formData, has_odor: e.target.checked })}
                  />
                }
                label="有异味"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_pest}
                    onChange={(e) => setFormData({ ...formData, has_pest: e.target.checked })}
                  />
                }
                label="有虫害"
              />
            </Box>
            <TextField
              label="处理备注"
              value={formData.handling_notes}
              onChange={(e) => setFormData({ ...formData, handling_notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InspectionRecords;
