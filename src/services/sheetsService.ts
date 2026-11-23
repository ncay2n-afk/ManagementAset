import {
  OfficeAsset,
  AssetTransaction,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
  StockOpnameSession,
  DisposalRecord,
  DisposalType,
  MasterBuildingLocation,
  MasterVendor,
  MasterCompanySettings,
  AppUserAccount,
  AppUserRole
} from '../types';
import { CodeItem } from '../data/assetCodeGenerator';

export const TAB_ASSETS = 'Daftar_Aset';
export const TAB_TRANSACTIONS = 'Riwayat_Mutasi';
export const TAB_MAINTENANCE = 'Pemeliharaan_Servis';
export const TAB_OPNAME = 'Stock_Opname';
export const TAB_DISPOSAL = 'Penghapusan_BAPA';
export const TAB_LOCATIONS = 'Master_Lokasi';
export const TAB_VENDORS = 'Master_Vendor';
export const TAB_DIVISIONS = 'Master_Divisi';
export const TAB_SUB_KELOMPOKS = 'Master_SubKelompok';
export const TAB_SETTINGS = 'Pengaturan_Aplikasi';
export const TAB_USERS = 'Master_Pengguna';

export interface FullSpreadsheetDatabase {
  assets: OfficeAsset[];
  transactions: AssetTransaction[];
  maintenanceRecords: MaintenanceRecord[];
  stockOpnameSessions: StockOpnameSession[];
  disposalRecords: DisposalRecord[];
  locations: MasterBuildingLocation[];
  vendors: MasterVendor[];
  customDivisions: CodeItem[];
  customSubKelompoks: CodeItem[];
  companySettings: MasterCompanySettings;
  users?: AppUserAccount[];
}

export const ASSET_HEADERS = [
  'ID Aset',
  'Nama Aset',
  'Kategori',
  'SKU / Barcode',
  'Total Stok',
  'Stok Tersedia',
  'Stok Dipinjam',
  'Stok Rusak',
  'Satuan',
  'Lokasi',
  'Kondisi',
  'Status',
  'Tanggal Pembelian',
  'Harga Beli (IDR)',
  'PIC Penanggung Jawab',
  'Tautan Foto Google Drive',
  'Tanggal Foto',
  'Catatan',
  'Terakhir Diperbarui',
  'Nomor Seri (SN)',
  'Masa Manfaat (Tahun)',
  'Nilai Residu (IDR)',
  'Tgl Berakhir Garansi',
  'Tgl Jatuh Tempo Pajak',
];

export const TRANSACTION_HEADERS = [
  'ID Transaksi',
  'ID Aset',
  'Nama Aset',
  'Jenis Transaksi',
  'Jumlah',
  'Nama Staf',
  'Email Staf',
  'Departemen / Divisi',
  'Tanggal & Waktu',
  'Rencana Kembali',
  'Kondisi Sebelum',
  'Kondisi Sesudah',
  'Tautan Foto Bukti Google Drive',
  'ID File Drive',
  'Path Folder Drive',
  'Catatan / Alasan',
  'Status Notifikasi Email',
  'Penerima Email',
  'Lokasi Sebelum',
  'Lokasi Sesudah',
  'Tgl Dikembalikan Aktual',
];

export const MAINTENANCE_HEADERS = [
  'ID Servis',
  'ID Aset',
  'Nama Aset',
  'Jenis Pemeliharaan',
  'Tgl Terjadwal',
  'Tgl Selesai',
  'Vendor / Teknisi',
  'Estimasi Biaya',
  'Biaya Aktual',
  'Status',
  'Catatan',
  'Link Nota Drive',
  'Dibuat Pada',
];

export const OPNAME_HEADERS = [
  'ID Sesi',
  'Judul Sesi',
  'Kode Divisi',
  'Nama Divisi',
  'Lokasi',
  'Tgl Terjadwal',
  'Status',
  'Auditor',
  'Catatan',
  'Total Ekspektasi',
  'Terverifikasi',
  'Selisih',
  'Selesai Pada',
  'Dibuat Pada',
  'Daftar Item JSON',
];

export const DISPOSAL_HEADERS = [
  'ID Penghapusan',
  'Nomor BAPA',
  'ID Aset',
  'Nama Aset',
  'Kategori',
  'Jenis Penghapusan',
  'Tgl Pengajuan',
  'Nilai Sisa / Lelang',
  'Nilai Buku',
  'Harga Perolehan',
  'Alasan',
  'Status',
  'PIC Approver',
  'Saksi',
  'Dibuat Pada',
];

export const LOCATION_HEADERS = ['ID Lokasi', 'Nama Gedung', 'Lantai / Zona', 'Nama Ruangan', 'Catatan'];

export const VENDOR_HEADERS = ['ID Vendor', 'Nama Vendor', 'Kategori Servis', 'Telepon', 'Email', 'Alamat', 'Nama PIC'];

export const CODE_ITEM_HEADERS = ['Kode', 'Nama'];

export const SETTINGS_HEADERS = ['Key', 'Value'];

export const USER_HEADERS = [
  'ID Pengguna',
  'Username',
  'Nama Lengkap',
  'Email',
  'Peran (Role)',
  'Divisi / Jabatan',
  'Status Aktif',
  'Password Hash',
  'Salt',
  'Dibuat Pada',
  'Login Terakhir',
];

const ALL_TABS_CONFIG: { title: string; headers: string[] }[] = [
  { title: TAB_ASSETS, headers: ASSET_HEADERS },
  { title: TAB_TRANSACTIONS, headers: TRANSACTION_HEADERS },
  { title: TAB_MAINTENANCE, headers: MAINTENANCE_HEADERS },
  { title: TAB_OPNAME, headers: OPNAME_HEADERS },
  { title: TAB_DISPOSAL, headers: DISPOSAL_HEADERS },
  { title: TAB_LOCATIONS, headers: LOCATION_HEADERS },
  { title: TAB_VENDORS, headers: VENDOR_HEADERS },
  { title: TAB_DIVISIONS, headers: CODE_ITEM_HEADERS },
  { title: TAB_SUB_KELOMPOKS, headers: CODE_ITEM_HEADERS },
  { title: TAB_SETTINGS, headers: SETTINGS_HEADERS },
  { title: TAB_USERS, headers: USER_HEADERS },
];

function safeCell(val: string | number | boolean | null | undefined): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  // Google Sheets single cell limit is 50,000 chars
  if (str.length > 45000) {
    return '';
  }
  return str;
}

export async function findDatabaseSpreadsheet(
  token: string,
  namePrefix: string = 'AsetKantor_Database_Inventaris'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; name: string } | null> {
  const query = `name contains '${namePrefix.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&orderBy=modifiedTime desc&pageSize=5&fields=files(id,name,webViewLink)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const first = data?.files?.[0];
  if (!first?.id) return null;

  return {
    spreadsheetId: first.id,
    spreadsheetUrl: first.webViewLink || `https://docs.google.com/spreadsheets/d/${first.id}/edit`,
    name: first.name || namePrefix,
  };
}

export async function createSpreadsheet(
  token: string,
  title: string = 'AsetKantor_Database_Inventaris'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  return createDatabaseSpreadsheet(token, title);
}

export async function createDatabaseSpreadsheet(
  token: string,
  title: string = 'AsetKantor_Database_Inventaris'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const payload = {
    properties: {
      title,
    },
    sheets: ALL_TABS_CONFIG.map((tab) => ({
      properties: {
        title: tab.title,
        gridProperties: { rowCount: 1000, columnCount: Math.max(tab.headers.length + 2, 10) },
      },
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat Database Google Spreadsheet: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl =
    data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write headers for all tabs in one batchUpdate call
  const headerData = ALL_TABS_CONFIG.map((tab) => ({
    range: `${tab.title}!A1`,
    majorDimension: 'ROWS',
    values: [tab.headers],
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData,
    }),
  });

  return { spreadsheetId, spreadsheetUrl };
}

export async function ensureDatabaseTabs(token: string, spreadsheetId: string): Promise<string[]> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Gagal membaca struktur Google Spreadsheet (${metaRes.status}): ${errText}`);
  }

  const meta = await metaRes.json();
  const existingTitles: string[] = (meta.sheets || [])
    .map((s: any) => s?.properties?.title)
    .filter(Boolean);

  const missingTabs = ALL_TABS_CONFIG.filter((tab) => !existingTitles.includes(tab.title));

  if (missingTabs.length > 0) {
    const addRequests = missingTabs.map((tab) => ({
      addSheet: {
        properties: {
          title: tab.title,
          gridProperties: { rowCount: 1000, columnCount: Math.max(tab.headers.length + 2, 10) },
        },
      },
    }));

    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: addRequests }),
      }
    );

    if (!batchRes.ok) {
      const errText = await batchRes.text();
      throw new Error(`Gagal membuat tab database di Spreadsheet: ${errText}`);
    }
  }

  return ALL_TABS_CONFIG.map((t) => t.title);
}

export async function appendRow(
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rowValues: (string | number | boolean | null | undefined)[]
): Promise<void> {
  const safeValues = rowValues.map((v) => safeCell(v));
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    sheetName
  )}!A1:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values: [safeValues],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menulis baris ke Google Sheets: ${res.status} ${errText}`);
  }
}

export function assetToRow(asset: OfficeAsset): string[] {
  return [
    safeCell(asset.id),
    safeCell(asset.name),
    safeCell(asset.category),
    safeCell(asset.sku),
    safeCell(asset.totalStock),
    safeCell(asset.availableStock),
    safeCell(asset.borrowedStock),
    safeCell(asset.damagedStock),
    safeCell(asset.unit),
    safeCell(asset.location),
    safeCell(asset.condition),
    safeCell(asset.status),
    safeCell(asset.purchaseDate),
    safeCell(asset.purchasePrice),
    safeCell(asset.custodian),
    safeCell(asset.lastPhotoUrl && !asset.lastPhotoUrl.startsWith('blob:') ? asset.lastPhotoUrl : ''),
    safeCell(asset.lastPhotoDate || ''),
    safeCell(asset.notes),
    safeCell(asset.updatedAt),
    safeCell(asset.serialNumber || ''),
    safeCell(asset.usefulLifeYears ?? ''),
    safeCell(asset.residualValue ?? ''),
    safeCell(asset.warrantyExpiryDate || ''),
    safeCell(asset.taxExpiryDate || ''),
  ];
}

export function transactionToRow(trx: AssetTransaction): string[] {
  return [
    safeCell(trx.id),
    safeCell(trx.assetId),
    safeCell(trx.assetName),
    safeCell(trx.type),
    safeCell(trx.quantity),
    safeCell(trx.staffName),
    safeCell(trx.staffEmail),
    safeCell(trx.department),
    safeCell(trx.date),
    safeCell(trx.expectedReturnDate || ''),
    safeCell(trx.conditionBefore),
    safeCell(trx.conditionAfter),
    safeCell(trx.photoDriveUrl || ''),
    safeCell(trx.photoDriveFileId || ''),
    safeCell(trx.photoDriveFolderName || ''),
    safeCell(trx.notes),
    safeCell(trx.emailNotificationSent ? 'Terkirim' : 'Tidak Terkirim'),
    safeCell(trx.emailRecipient),
    safeCell(trx.locationBefore || ''),
    safeCell(trx.locationAfter || ''),
    safeCell(trx.actualReturnDate || ''),
  ];
}

function maintenanceToRow(rec: MaintenanceRecord): string[] {
  return [
    safeCell(rec.id),
    safeCell(rec.assetId),
    safeCell(rec.assetName),
    safeCell(rec.serviceType),
    safeCell(rec.scheduledDate),
    safeCell(rec.completedDate || ''),
    safeCell(rec.vendorOrTechnician),
    safeCell(rec.estimatedCost),
    safeCell(rec.actualCost ?? ''),
    safeCell(rec.status),
    safeCell(rec.notes),
    safeCell(rec.driveInvoiceUrl || ''),
    safeCell(rec.createdAt),
  ];
}

function opnameToRow(s: StockOpnameSession): string[] {
  let itemsJson = '';
  try {
    const serialized = JSON.stringify(s.items || []);
    itemsJson = serialized.length <= 45000 ? serialized : '[]';
  } catch {
    itemsJson = '[]';
  }
  return [
    safeCell(s.id),
    safeCell(s.title),
    safeCell(s.divisionCode || ''),
    safeCell(s.divisionName || ''),
    safeCell(s.location),
    safeCell(s.scheduledDate),
    safeCell(s.status),
    safeCell(s.auditorName),
    safeCell(s.notes),
    safeCell(s.totalExpectedAssets),
    safeCell(s.verifiedCount),
    safeCell(s.discrepancyCount),
    safeCell(s.completedAt || ''),
    safeCell(s.createdAt),
    itemsJson,
  ];
}

function disposalToRow(d: DisposalRecord): string[] {
  return [
    safeCell(d.id),
    safeCell(d.documentNumber),
    safeCell(d.assetId),
    safeCell(d.assetName),
    safeCell(d.category),
    safeCell(d.disposalType),
    safeCell(d.requestDate),
    safeCell(d.salvageRecoveryAmount),
    safeCell(d.bookValueAtDisposal),
    safeCell(d.originalPrice),
    safeCell(d.reason),
    safeCell(d.status),
    safeCell(d.picApprover),
    safeCell(d.witnessName || ''),
    safeCell(d.createdAt),
  ];
}

function locationToRow(loc: MasterBuildingLocation): string[] {
  return [
    safeCell(loc.id),
    safeCell(loc.buildingName),
    safeCell(loc.floor),
    safeCell(loc.roomName),
    safeCell(loc.notes || ''),
  ];
}

function vendorToRow(v: MasterVendor): string[] {
  return [
    safeCell(v.id),
    safeCell(v.name),
    safeCell(v.serviceCategory),
    safeCell(v.phone),
    safeCell(v.email || ''),
    safeCell(v.address || ''),
    safeCell(v.picName),
  ];
}

function codeItemToRow(item: CodeItem): string[] {
  return [safeCell(item.code), safeCell(item.name)];
}

function settingsToRows(cfg: MasterCompanySettings): string[][] {
  return [
    ['companyName', safeCell(cfg.companyName)],
    ['brandSubtitle', safeCell(cfg.brandSubtitle)],
    ['logoUrl', cfg.logoUrl && cfg.logoUrl.length <= 45000 ? cfg.logoUrl : ''],
    ['address', safeCell(cfg.address)],
    ['phone', safeCell(cfg.phone)],
    ['email', safeCell(cfg.email)],
    ['defaultUsefulLifeYears', safeCell(cfg.defaultUsefulLifeYears)],
    ['defaultResidualPercent', safeCell(cfg.defaultResidualPercent)],
    ['bastNumberPrefix', safeCell(cfg.bastNumberPrefix)],
    ['bapaNumberPrefix', safeCell(cfg.bapaNumberPrefix)],
    ['soNumberPrefix', safeCell(cfg.soNumberPrefix)],
    ['assetCodeSeparator', safeCell(cfg.assetCodeSeparator)],
  ];
}

function userToRow(u: AppUserAccount): string[] {
  return [
    safeCell(u.id),
    safeCell(u.username.trim().toLowerCase()),
    safeCell(u.fullName),
    safeCell(u.email.trim()),
    safeCell(u.role),
    safeCell(u.department),
    u.isActive ? 'Aktif' : 'Nonaktif',
    safeCell(u.passwordHash),
    safeCell(u.passwordSalt),
    safeCell(u.createdAt),
    safeCell(u.lastLoginAt || ''),
  ];
}

function normalizeUserRole(raw: string | undefined): AppUserRole {
  const val = String(raw || '').trim().toUpperCase();
  if (val === 'SUPER_ADMIN' || val === 'SUPER ADMIN' || val === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (val === 'ADMIN' || val === 'ADMIN ASET') return 'ADMIN';
  if (val === 'AUDITOR' || val === 'VIEWER') return 'AUDITOR';
  return 'OPERATOR';
}

function parseActiveStatus(raw: string | undefined): boolean {
  const val = String(raw || '').trim().toLowerCase();
  if (!val) return true;
  if (val === 'nonaktif' || val === 'tidak aktif' || val === 'false' || val === '0' || val === 'no' || val === 'tidak') {
    return false;
  }
  return true;
}

export function parseUserRows(rows: string[][]): AppUserAccount[] {
  return rows
    .filter((r) => (r[0] && String(r[0]).trim() !== '') || (r[1] && String(r[1]).trim() !== ''))
    .map((r, idx) => ({
      id: r[0]?.trim() || `USR-${String(idx + 1).padStart(3, '0')}`,
      username: (r[1] || r[3] || `user${idx + 1}`).trim().toLowerCase(),
      fullName: r[2]?.trim() || r[1]?.trim() || 'Pengguna',
      email: (r[3] || '').trim(),
      role: normalizeUserRole(r[4]),
      department: r[5]?.trim() || 'Umum',
      isActive: parseActiveStatus(r[6]),
      passwordHash: (r[7] || '').trim(),
      passwordSalt: (r[8] || '').trim(),
      createdAt: r[9]?.trim() || new Date().toISOString(),
      lastLoginAt: r[10]?.trim() || undefined,
    }));
}

export async function fetchUsersFromSpreadsheet(
  token: string,
  spreadsheetId: string
): Promise<AppUserAccount[]> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Gagal memeriksa tab ${TAB_USERS} di Spreadsheet (${metaRes.status}): ${errText}`);
  }
  const meta = await metaRes.json();
  const existingTitles: string[] = (meta.sheets || [])
    .map((s: any) => s?.properties?.title)
    .filter(Boolean);

  if (!existingTitles.includes(TAB_USERS)) {
    return [];
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${TAB_USERS}!A2:K1000`
    )}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membaca daftar user dari Spreadsheet: ${errText}`);
  }

  const data = await res.json();
  return parseUserRows(data.values || []);
}

export async function syncUsersToSpreadsheet(
  token: string,
  spreadsheetId: string,
  users: AppUserAccount[]
): Promise<void> {
  await ensureDatabaseTabs(token, spreadsheetId);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${TAB_USERS}!A:Z`
    )}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const rows = [USER_HEADERS, ...users.map(userToRow)];
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${TAB_USERS}!A1`
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${TAB_USERS}!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menyimpan daftar akun ke tab ${TAB_USERS}: ${errText}`);
  }
}

export async function saveFullDatabaseToSpreadsheet(
  token: string,
  spreadsheetId: string,
  db: FullSpreadsheetDatabase
): Promise<void> {
  await ensureDatabaseTabs(token, spreadsheetId);

  const rangesToClear = ALL_TABS_CONFIG.map((t) => `${t.title}!A:Z`);

  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ranges: rangesToClear }),
    }
  );

  if (!clearRes.ok) {
    const errText = await clearRes.text();
    throw new Error(`Gagal membersihkan tab Spreadsheet sebelum update: ${errText}`);
  }

  const dataPayload = [
    {
      range: `${TAB_ASSETS}!A1`,
      majorDimension: 'ROWS',
      values: [ASSET_HEADERS, ...db.assets.map(assetToRow)],
    },
    {
      range: `${TAB_TRANSACTIONS}!A1`,
      majorDimension: 'ROWS',
      values: [TRANSACTION_HEADERS, ...db.transactions.map(transactionToRow)],
    },
    {
      range: `${TAB_MAINTENANCE}!A1`,
      majorDimension: 'ROWS',
      values: [MAINTENANCE_HEADERS, ...db.maintenanceRecords.map(maintenanceToRow)],
    },
    {
      range: `${TAB_OPNAME}!A1`,
      majorDimension: 'ROWS',
      values: [OPNAME_HEADERS, ...db.stockOpnameSessions.map(opnameToRow)],
    },
    {
      range: `${TAB_DISPOSAL}!A1`,
      majorDimension: 'ROWS',
      values: [DISPOSAL_HEADERS, ...db.disposalRecords.map(disposalToRow)],
    },
    {
      range: `${TAB_LOCATIONS}!A1`,
      majorDimension: 'ROWS',
      values: [LOCATION_HEADERS, ...db.locations.map(locationToRow)],
    },
    {
      range: `${TAB_VENDORS}!A1`,
      majorDimension: 'ROWS',
      values: [VENDOR_HEADERS, ...db.vendors.map(vendorToRow)],
    },
    {
      range: `${TAB_DIVISIONS}!A1`,
      majorDimension: 'ROWS',
      values: [CODE_ITEM_HEADERS, ...db.customDivisions.map(codeItemToRow)],
    },
    {
      range: `${TAB_SUB_KELOMPOKS}!A1`,
      majorDimension: 'ROWS',
      values: [CODE_ITEM_HEADERS, ...db.customSubKelompoks.map(codeItemToRow)],
    },
    {
      range: `${TAB_SETTINGS}!A1`,
      majorDimension: 'ROWS',
      values: [SETTINGS_HEADERS, ...settingsToRows(db.companySettings)],
    },
    {
      range: `${TAB_USERS}!A1`,
      majorDimension: 'ROWS',
      values: [USER_HEADERS, ...(db.users || []).map(userToRow)],
    },
  ];

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload,
      }),
    }
  );

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    throw new Error(`Gagal menyimpan database ke Google Spreadsheet: ${errText}`);
  }
}

function parseAssetsRows(rows: string[][]): OfficeAsset[] {
  return rows
    .filter((r) => r[0] && String(r[0]).trim() !== '')
    .map((r) => ({
      id: r[0] || '',
      name: r[1] || 'Aset Tanpa Nama',
      category: (r[2] as AssetCategory) || 'IT & Elektronik',
      sku: r[3] || '',
      totalStock: Number(r[4]) || 0,
      availableStock: Number(r[5]) || 0,
      borrowedStock: Number(r[6]) || 0,
      damagedStock: Number(r[7]) || 0,
      unit: r[8] || 'Unit',
      location: r[9] || 'Kantor',
      condition: (r[10] as AssetCondition) || 'Baik',
      status: (r[11] as AssetStatus) || 'Tersedia',
      purchaseDate: r[12] || '',
      purchasePrice: Number(r[13]) || 0,
      custodian: r[14] || '',
      lastPhotoUrl: r[15] || '',
      lastPhotoDate: r[16] || '',
      notes: r[17] || '',
      updatedAt: r[18] || new Date().toISOString(),
      serialNumber: r[19] || undefined,
      usefulLifeYears: r[20] ? Number(r[20]) : undefined,
      residualValue: r[21] ? Number(r[21]) : undefined,
      warrantyExpiryDate: r[22] || undefined,
      taxExpiryDate: r[23] || undefined,
    }));
}

export async function loadFullDatabaseFromSpreadsheet(
  token: string,
  spreadsheetId: string
): Promise<Partial<FullSpreadsheetDatabase>> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`Gagal membuka Google Spreadsheet (${metaRes.status}): ${errText}`);
  }

  const meta = await metaRes.json();
  const existingTitles: string[] = (meta.sheets || [])
    .map((s: any) => s?.properties?.title)
    .filter(Boolean);

  const tabsToRead = ALL_TABS_CONFIG.filter((t) => existingTitles.includes(t.title));
  if (tabsToRead.length === 0) {
    return {};
  }

  const rangesQuery = tabsToRead
    .map((t) => `ranges=${encodeURIComponent(`${t.title}!A2:Z2000`)}`)
    .join('&');

  const batchGetRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!batchGetRes.ok) {
    const errText = await batchGetRes.text();
    throw new Error(`Gagal membaca isi database Google Spreadsheet: ${errText}`);
  }

  const batchData = await batchGetRes.json();
  const valueRanges: { range: string; values?: string[][] }[] = batchData.valueRanges || [];

  const rowsByTab: Record<string, string[][]> = {};
  tabsToRead.forEach((tab, idx) => {
    rowsByTab[tab.title] = valueRanges[idx]?.values || [];
  });

  const result: Partial<FullSpreadsheetDatabase> = {};

  if (rowsByTab[TAB_ASSETS] && rowsByTab[TAB_ASSETS].length > 0) {
    result.assets = parseAssetsRows(rowsByTab[TAB_ASSETS]);
  }

  if (rowsByTab[TAB_TRANSACTIONS]) {
    result.transactions = rowsByTab[TAB_TRANSACTIONS]
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        assetId: r[1] || '',
        assetName: r[2] || '',
        type: (r[3] as AssetTransaction['type']) || 'PEMINJAMAN',
        quantity: Number(r[4]) || 1,
        staffName: r[5] || '',
        staffEmail: r[6] || '',
        department: r[7] || '',
        date: r[8] || '',
        expectedReturnDate: r[9] && r[9] !== '-' ? r[9] : undefined,
        conditionBefore: (r[10] as AssetCondition) || 'Baik',
        conditionAfter: (r[11] as AssetCondition) || 'Baik',
        photoDriveUrl: r[12] || undefined,
        photoDriveFileId: r[13] || undefined,
        photoDriveFolderName: r[14] || undefined,
        notes: r[15] || '',
        emailNotificationSent: r[16] === 'Terkirim',
        emailRecipient: r[17] || '',
        locationBefore: r[18] || undefined,
        locationAfter: r[19] || undefined,
        actualReturnDate: r[20] || undefined,
      }));
  }

  if (rowsByTab[TAB_MAINTENANCE]) {
    result.maintenanceRecords = rowsByTab[TAB_MAINTENANCE]
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        assetId: r[1] || '',
        assetName: r[2] || '',
        serviceType: (r[3] as MaintenanceType) || 'Rutin Berkala',
        scheduledDate: r[4] || '',
        completedDate: r[5] || undefined,
        vendorOrTechnician: r[6] || '',
        estimatedCost: Number(r[7]) || 0,
        actualCost: r[8] ? Number(r[8]) : undefined,
        status: (r[9] as MaintenanceStatus) || 'Terjadwal',
        notes: r[10] || '',
        driveInvoiceUrl: r[11] || undefined,
        createdAt: r[12] || new Date().toISOString(),
      }));
  }

  if (rowsByTab[TAB_OPNAME]) {
    result.stockOpnameSessions = rowsByTab[TAB_OPNAME]
      .filter((r) => r[0])
      .map((r) => {
        let items = [];
        try {
          if (r[14]) items = JSON.parse(r[14]);
        } catch {}
        return {
          id: r[0] || '',
          title: r[1] || '',
          divisionCode: r[2] || undefined,
          divisionName: r[3] || undefined,
          location: r[4] || '',
          scheduledDate: r[5] || '',
          status: (r[6] as StockOpnameSession['status']) || 'DRAF',
          auditorName: r[7] || '',
          notes: r[8] || '',
          totalExpectedAssets: Number(r[9]) || 0,
          verifiedCount: Number(r[10]) || 0,
          discrepancyCount: Number(r[11]) || 0,
          completedAt: r[12] || undefined,
          createdAt: r[13] || new Date().toISOString(),
          items: Array.isArray(items) ? items : [],
        };
      });
  }

  if (rowsByTab[TAB_DISPOSAL]) {
    result.disposalRecords = rowsByTab[TAB_DISPOSAL]
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        documentNumber: r[1] || '',
        assetId: r[2] || '',
        assetName: r[3] || '',
        category: r[4] || '',
        disposalType: (r[5] as DisposalType) || 'AFKIR_RUSAK_BERAT',
        requestDate: r[6] || '',
        salvageRecoveryAmount: Number(r[7]) || 0,
        bookValueAtDisposal: Number(r[8]) || 0,
        originalPrice: Number(r[9]) || 0,
        reason: r[10] || '',
        status: (r[11] as DisposalRecord['status']) || 'DIAJUKAN',
        picApprover: r[12] || '',
        witnessName: r[13] || undefined,
        createdAt: r[14] || new Date().toISOString(),
      }));
  }

  if (rowsByTab[TAB_LOCATIONS] && rowsByTab[TAB_LOCATIONS].length > 0) {
    result.locations = rowsByTab[TAB_LOCATIONS]
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        buildingName: r[1] || '',
        floor: r[2] || '',
        roomName: r[3] || '',
        notes: r[4] || undefined,
      }));
  }

  if (rowsByTab[TAB_VENDORS] && rowsByTab[TAB_VENDORS].length > 0) {
    result.vendors = rowsByTab[TAB_VENDORS]
      .filter((r) => r[0])
      .map((r) => ({
        id: r[0] || '',
        name: r[1] || '',
        serviceCategory: r[2] || '',
        phone: r[3] || '',
        email: r[4] || undefined,
        address: r[5] || undefined,
        picName: r[6] || '',
      }));
  }

  if (rowsByTab[TAB_DIVISIONS] && rowsByTab[TAB_DIVISIONS].length > 0) {
    result.customDivisions = rowsByTab[TAB_DIVISIONS]
      .filter((r) => r[0] && r[1])
      .map((r) => ({ code: r[0], name: r[1] }));
  }

  if (rowsByTab[TAB_SUB_KELOMPOKS] && rowsByTab[TAB_SUB_KELOMPOKS].length > 0) {
    result.customSubKelompoks = rowsByTab[TAB_SUB_KELOMPOKS]
      .filter((r) => r[0] && r[1])
      .map((r) => ({ code: r[0], name: r[1] }));
  }

  if (rowsByTab[TAB_SETTINGS] && rowsByTab[TAB_SETTINGS].length > 0) {
    const map: Record<string, string> = {};
    rowsByTab[TAB_SETTINGS].forEach((r) => {
      if (r[0]) map[r[0]] = r[1] || '';
    });
    if (map.companyName) {
      result.companySettings = {
        companyName: map.companyName,
        brandSubtitle: map.brandSubtitle || '',
        logoUrl: map.logoUrl || undefined,
        address: map.address || '',
        phone: map.phone || '',
        email: map.email || '',
        defaultUsefulLifeYears: Number(map.defaultUsefulLifeYears) || 4,
        defaultResidualPercent: Number(map.defaultResidualPercent) || 10,
        bastNumberPrefix: map.bastNumberPrefix || 'BAST/AST',
        bapaNumberPrefix: map.bapaNumberPrefix || 'BAPA/GA',
        soNumberPrefix: map.soNumberPrefix || 'BA-SO',
        assetCodeSeparator: map.assetCodeSeparator === '-' ? '-' : '.',
      };
    }
  }

  if (rowsByTab[TAB_USERS]) {
    result.users = parseUserRows(rowsByTab[TAB_USERS]);
  }

  return result;
}

export async function syncAssetsToSheet(
  token: string,
  spreadsheetId: string,
  assets: OfficeAsset[]
): Promise<void> {
  await ensureDatabaseTabs(token, spreadsheetId);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      `${TAB_ASSETS}!A:Z`
    )}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const rows = [ASSET_HEADERS, ...assets.map(assetToRow)];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    `${TAB_ASSETS}!A1`
  )}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${TAB_ASSETS}!A1`,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal sinkronisasi data aset ke Google Sheets: ${err}`);
  }
}

export async function fetchAssetsFromSheet(
  token: string,
  spreadsheetId: string
): Promise<OfficeAsset[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    `${TAB_ASSETS}!A2:Z2000`
  )}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Gagal membaca data aset dari Google Sheets');
  }

  const data = await res.json();
  return parseAssetsRows(data.values || []);
}
