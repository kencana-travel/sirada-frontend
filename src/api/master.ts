import api from './client';
import type {
  ArmadaInput,
  ArmadaMaster,
  CabangMaster,
  JadwalInput,
  JadwalMaster,
  RuteInput,
  RuteMaster,
} from '../types/master';

interface PesanRaw {
  pesan: string;
}

/* ============================ CABANG (baca saja) ============================ */

export async function getCabangMaster(): Promise<CabangMaster[]> {
  const { data } = await api.get<CabangMaster[]>('/api/master/cabang');
  return data;
}

/* ============================ RUTE ============================ */

/** Kepala Outlet hanya menerima rute yang berangkat dari cabangnya. */
export async function getRuteMaster(): Promise<RuteMaster[]> {
  const { data } = await api.get<RuteMaster[]>('/api/master/rute');
  return data;
}

export async function createRute(payload: RuteInput): Promise<RuteMaster> {
  const { data } = await api.post<RuteMaster>('/api/master/rute', payload);
  return data;
}

export async function updateRute(id: string, payload: RuteInput): Promise<RuteMaster> {
  const { data } = await api.put<RuteMaster>(`/api/master/rute/${id}`, payload);
  return data;
}

export async function deleteRute(id: string): Promise<string> {
  const { data } = await api.delete<PesanRaw>(`/api/master/rute/${id}`);
  return data.pesan;
}

/* ============================ ARMADA ============================ */

export async function getArmadaMaster(): Promise<ArmadaMaster[]> {
  const { data } = await api.get<ArmadaMaster[]>('/api/master/armada');
  return data;
}

export async function createArmada(payload: ArmadaInput): Promise<ArmadaMaster> {
  const { data } = await api.post<ArmadaMaster>('/api/master/armada', payload);
  return data;
}

export async function updateArmada(id: string, payload: ArmadaInput): Promise<ArmadaMaster> {
  const { data } = await api.put<ArmadaMaster>(`/api/master/armada/${id}`, payload);
  return data;
}

export async function deleteArmada(id: string): Promise<string> {
  const { data } = await api.delete<PesanRaw>(`/api/master/armada/${id}`);
  return data.pesan;
}

/* ============================ JADWAL ============================ */

export async function getJadwalMaster(idRute?: string): Promise<JadwalMaster[]> {
  const { data } = await api.get<JadwalMaster[]>('/api/master/jadwal', {
    params: { id_rute: idRute || undefined },
  });
  return data;
}

export async function createJadwal(payload: JadwalInput): Promise<JadwalMaster> {
  const { data } = await api.post<JadwalMaster>('/api/master/jadwal', payload);
  return data;
}

export async function updateJadwal(id: string, payload: JadwalInput): Promise<JadwalMaster> {
  const { data } = await api.put<JadwalMaster>(`/api/master/jadwal/${id}`, payload);
  return data;
}

export async function deleteJadwal(id: string): Promise<string> {
  const { data } = await api.delete<PesanRaw>(`/api/master/jadwal/${id}`);
  return data.pesan;
}
