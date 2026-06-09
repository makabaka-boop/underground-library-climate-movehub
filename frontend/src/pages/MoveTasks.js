import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Chip,
  Divider,
} from '@mui/material';
import { Add, Edit, Info } from '@mui/icons-material';
import { getMoveTasks, createMoveTask, updateMoveTask, getBookshelves, getMovePlans } from '../api';

const statusOptions = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const MoveTasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moveTasks, setMoveTasks] = useState([]);
  const [bookshelves, setBookshelves] = useState([]);
  const [movePlans, setMovePlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [fromRiskInspection, setFromRiskInspection] = useState(false);
  const [riskInfo, setRiskInfo] = useState(null);
  const [formData, setFormData] = useState({
    bookshelf_id: '',
    responsible_person: '',
    planned_start_time: '',
    planned_end_time: '',
    source_location: '',
    target_location: '',
    risk_description: '',
    move_plan_id: '',
    status: 'pending',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
    loadBookshelves();
    loadMovePlans();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookshelfId = params.get('bookshelf_id');
    if (bookshelfId && bookshelves.length > 0) {
      const riskData = {
        bookshelf_id: parseInt(bookshelfId),
        bookshelf_code: params.get('bookshelf_code'),
        area_id: params.get('area_id'),
        area_name: params.get('area_name'),
        humidity: params.get('humidity'),
        temperature: params.get('temperature'),
        mold_level: params.get('mold_level'),
        has_odor: params.get('has_odor') === 'true',
        has_pest: params.get('has_pest') === 'true',
        risk_description: params.get('risk_description'),
        source_location: params.get('source_location'),
      };
      setRiskInfo(riskData);
      setFromRiskInspection(true);
      setFormData({
        bookshelf_id: parseInt(bookshelfId),
        responsible_person: '',
        planned_start_time: '',
        planned_end_time: '',
        source_location: riskData.source_location || '',
        target_location: '',
        risk_description: riskData.risk_description || '',
        move_plan_id: '',
        status: 'pending',
      });
      setOpen(true);
      navigate('/move-tasks', { replace: true });
    }
  }, [location.search, bookshelves]);

  const loadData = async () => {
    try {
      const data = await getMoveTasks();
      setMoveTasks(data);
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

  const loadMovePlans = async () => {
    try {
      const data = await getMovePlans();
      setMovePlans(data);
    } catch (error) {
      console.error('Failed to load move plans:', error);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditItem(item);
      setFromRiskInspection(false);
      setRiskInfo(null);
      setFormData({
        bookshelf_id: item.bookshelf_id,
        responsible_person: item.responsible_person,
        planned_start_time: item.planned_start_time ? item.planned_start_time.slice(0, 16) : '',
        planned_end_time: item.planned_end_time ? item.planned_end_time.slice(0, 16) : '',
        source_location: item.source_location,
        target_location: item.target_location,
        risk_description: item.risk_description || '',
        move_plan_id: item.move_plan_id || '',
        status: item.status,
      });
    } else {
      setEditItem(null);
      setFromRiskInspection(false);
      setRiskInfo(null);
      setFormData({
        bookshelf_id: bookshelves[0]?.id || '',
        responsible_person: '',
        planned_start_time: '',
        planned_end_time: '',
        source_location: '',
        target_location: '',
        risk_description: '',
        move_plan_id: '',
        status: 'pending',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFromRiskInspection(false);
    setRiskInfo(null);
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await updateMoveTask(editItem.id, formData);
        showSnackbar('更新成功', 'success');
      } else {
        await createMoveTask(formData);
        showSnackbar('创建成功', 'success');
      }
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find((o) => o.value === status);
    return option ? option.label : status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">移架任务</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          新增任务
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>书架</TableCell>
                <TableCell>负责人</TableCell>
                <TableCell>计划开始时间</TableCell>
                <TableCell>计划结束时间</TableCell>
                <TableCell>源位置</TableCell>
                <TableCell>目标位置</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {moveTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{bookshelves.find((b) => b.id === task.bookshelf_id)?.code || '-'}</TableCell>
                  <TableCell>{task.responsible_person}</TableCell>
                  <TableCell>{new Date(task.planned_start_time).toLocaleString()}</TableCell>
                  <TableCell>{new Date(task.planned_end_time).toLocaleString()}</TableCell>
                  <TableCell>{task.source_location}</TableCell>
                  <TableCell>{task.target_location}</TableCell>
                  <TableCell>
                    <Chip label={getStatusLabel(task.status)} size="small" color={getStatusColor(task.status)} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(task)}>
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {moveTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editItem ? '编辑移架任务' : fromRiskInspection ? '从风险巡检创建移架任务' : '新增移架任务'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {fromRiskInspection && riskInfo && (
              <Alert severity="warning" icon={<Info />} sx={{ mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  风险巡检转移架建议 - 书架 {riskInfo.bookshelf_code}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                      所属库区:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {riskInfo.area_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={`湿度: ${riskInfo.humidity}%`} size="small" color="error" variant="outlined" />
                    <Chip label={`霉斑等级: ${riskInfo.mold_level}级`} size="small" color="error" variant="outlined" />
                    {riskInfo.has_odor && <Chip label="有异味" size="small" color="error" variant="outlined" />}
                    {riskInfo.has_pest && <Chip label="有虫害" size="small" color="error" variant="outlined" />}
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    建议处理原因:
                  </Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'background.paper', p: 1, borderRadius: 1 }}>
                    {riskInfo.risk_description}
                  </Typography>
                </Box>
              </Alert>
            )}
            <TextField
              select
              label="所属计划"
              value={formData.move_plan_id}
              onChange={(e) => setFormData({ ...formData, move_plan_id: parseInt(e.target.value) || '' })}
              fullWidth
            >
              <MenuItem value="">无</MenuItem>
              {movePlans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="书架"
              value={formData.bookshelf_id}
              onChange={(e) => setFormData({ ...formData, bookshelf_id: parseInt(e.target.value) })}
              fullWidth
              required
              disabled={fromRiskInspection}
            >
              {bookshelves.map((shelf) => (
                <MenuItem key={shelf.id} value={shelf.id}>
                  {shelf.code} - {shelf.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="负责人"
              value={formData.responsible_person}
              onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
              fullWidth
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="计划开始时间"
                type="datetime-local"
                value={formData.planned_start_time}
                onChange={(e) => setFormData({ ...formData, planned_start_time: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="计划结束时间"
                type="datetime-local"
                value={formData.planned_end_time}
                onChange={(e) => setFormData({ ...formData, planned_end_time: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="源位置"
                value={formData.source_location}
                onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                fullWidth
                required
                disabled={fromRiskInspection}
              />
              <TextField
                label="目标位置"
                value={formData.target_location}
                onChange={(e) => setFormData({ ...formData, target_location: e.target.value })}
                fullWidth
                required
              />
            </Box>
            <TextField
              label="风险说明"
              value={formData.risk_description}
              onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            {editItem && (
              <TextField
                select
                label="状态"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editItem ? '保存' : '创建'}
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

export default MoveTasks;
