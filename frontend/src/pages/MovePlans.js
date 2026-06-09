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
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getMovePlans, createMovePlan, updateMovePlan, deleteMovePlan } from '../api';

const planStatusOptions = [
  { value: 'planning', label: '规划中' },
  { value: 'in_progress', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const getPlanStatusLabel = (status) => {
  const opt = planStatusOptions.find((o) => o.value === status);
  return opt ? opt.label : status;
};

const getPlanStatusColor = (status) => {
  switch (status) {
    case 'planning': return 'default';
    case 'in_progress': return 'primary';
    case 'completed': return 'success';
    case 'cancelled': return 'warning';
    default: return 'default';
  }
};

const MovePlans = () => {
  const [movePlans, setMovePlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'planning' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getMovePlans();
      setMovePlans(data);
    } catch (error) {
      showSnackbar('加载数据失败', 'error');
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
      setFormData({
        name: item.name || '',
        description: item.description || '',
        status: item.status || 'planning',
      });
    } else {
      setEditItem(null);
      setFormData({ name: '', description: '', status: 'planning' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData({ name: '', description: '', status: 'planning' });
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await updateMovePlan(editItem.id, formData);
        showSnackbar('更新成功', 'success');
      } else {
        await createMovePlan({ name: formData.name, description: formData.description });
        showSnackbar('创建成功', 'success');
      }
      handleClose();
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '操作失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMovePlan(confirmDelete.id);
      showSnackbar('删除成功', 'success');
      setConfirmDelete(null);
      loadData();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || '删除失败', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">移架计划</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          新增计划
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>计划名称</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movePlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={getPlanStatusLabel(plan.status)}
                      size="small"
                      color={getPlanStatusColor(plan.status)}
                    />
                  </TableCell>
                  <TableCell>{new Date(plan.created_at).toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpen(plan)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setConfirmDelete(plan)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {movePlans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? '编辑移架计划' : '新增移架计划'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="计划名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                {planStatusOptions.map((option) => (
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
            {editItem ? '更新' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>删除计划</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除计划「{confirmDelete?.name}」吗？删除后无法恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            删除
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

export default MovePlans;
