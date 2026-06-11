import { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { getAllFiches } from '../../api/ficheAPI';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart3, FileSpreadsheet, FileText, Download } from 'lucide-react';

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [loadingType, setLoadingType] = useState('');

    const exportExcel = async () => {
        setLoading(true);
        setLoadingType('excel');
        try {
            const res = await getAllFiches();
            const data = res.data.map(f => ({
                'ID': f.id,
                'Importateur': f.importateurNom,
                'Statut': f.statut,
                'Date Création': f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : '-',
                'Date MAJ': f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('fr-FR') : '-',
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Fiches');
            XLSX.writeFile(wb, 'rapport_fiches.xlsx');
        } finally {
            setLoading(false);
            setLoadingType('');
        }
    };

    const exportPDF = async () => {
        setLoading(true);
        setLoadingType('pdf');
        try {
            const res = await getAllFiches();
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.setTextColor(30, 64, 175);
            doc.text('Port Tracking System', 14, 20);
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Rapport - Fiches Suiveuses', 14, 30);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 38);
            doc.text(`Total: ${res.data.length} fiche(s)`, 14, 44);

            autoTable(doc, {
                startY: 52,
                head: [['ID', 'Importateur', 'Statut', 'Date Création']],
                body: res.data.map(f => [
                    `#${f.id}`,
                    f.importateurNom,
                    f.statut,
                    f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : '-',
                ]),
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 247, 250] },
            });

            doc.save('rapport_fiches.pdf');
        } finally {
            setLoading(false);
            setLoadingType('');
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar title="Rapports & Exports" />
                <div className="p-6">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-6 text-white">
                        <div className="flex items-center gap-3">
                            <BarChart3 size={32} className="text-blue-200" />
                            <div>
                                <h2 className="text-xl font-bold">Rapports & Exports</h2>
                                <p className="text-blue-200 text-sm mt-1">
                                    Exportez vos données en Excel ou PDF
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Excel */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <FileSpreadsheet size={28} className="text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Export Excel</h3>
                                    <p className="text-gray-500 text-sm">Format .xlsx</p>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">
                                Exportez la liste complète des fiches suiveuses avec tous les détails dans un fichier Excel.
                            </p>
                            <button
                                onClick={exportExcel}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && loadingType === 'excel' ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Génération...</>
                                ) : (
                                    <><Download size={18} /> Télécharger Excel</>
                                )}
                            </button>
                        </div>

                        {/* PDF */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-red-100 p-3 rounded-xl">
                                    <FileText size={28} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">Export PDF</h3>
                                    <p className="text-gray-500 text-sm">Format .pdf</p>
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">
                                Générez un rapport PDF professionnel avec tableau récapitulatif de toutes les fiches.
                            </p>
                            <button
                                onClick={exportPDF}
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && loadingType === 'pdf' ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Génération...</>
                                ) : (
                                    <><Download size={18} /> Télécharger PDF</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;