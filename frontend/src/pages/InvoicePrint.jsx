import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, FileText } from "lucide-react";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/layout/BrandLogo";

export const InvoicePrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isClient } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [projectTotal, setProjectTotal] = useState(0);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await api.get(`/invoices?id=${id}`);
                const dataRaw = res.data.data !== undefined ? res.data.data : res.data;
                const invoiceData = Array.isArray(dataRaw) ? dataRaw[0] : dataRaw;
                setInvoice(invoiceData);
                
                // Récupérer le total du projet pour comparaison
                // Supposons que invoiceData.project_total existe, sinon on utilise amount
                const projTotal = invoiceData.project_total || invoiceData.project?.total_amount || invoiceData.amount;
                setProjectTotal(projTotal);
            } catch (error) {
                console.error("Échec du chargement des détails de la facture", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    // === LOGIQUE FACTURE vs DEVIS ===
    const determineDocumentType = (docAmount, projTotal) => {
        const isFullPayment = docAmount >= projTotal;
     
        return {
            type: isFullPayment ? 'FACTURE' : 'DEVIS',
            label: isFullPayment ? 'N° Facture' : 'N° Devis',
            prefix: isFullPayment ? 'FAC' : 'DEV',
            isInvoice: isFullPayment
        };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'MAD',
            minimumFractionDigits: 2
        }).format(amount || 0).replace('MAD', 'DH');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toISOString().split('T')[0];
    };

    // Convertir nombre en lettres (simplifié pour MAD)
    const numberToWords = (num) => {
        if (num === 0) return "Zéro dirham";
        if (num === 12000) return "Douze mille dirhams";
        if (num === 6000) return "Six mille dirhams";
        if (num === 15000) return "Quinze mille dirhams";
        if (num === 10000) return "Dix mille dirhams";
        if (num === 24000) return "Vingt-quatre mille dirhams";
        
        // Fallback générique
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        
        if (thousands > 0 && remainder === 0) {
            return `${thousands} mille dirhams`;
        }
        return `${num.toLocaleString('fr-FR')} dirhams`;
    };

    if (loading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
            Chargement du document...
        </div>
    );
    
    if (!invoice) return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-red-500 font-bold">
            Document non trouvé.
        </div>
    );

    // Calculs TVA 20%
    const tvaRate = 0.20;
    const amountHT = invoice.amount || 0;
    const tvaAmount = amountHT * tvaRate;
    const totalTTC = amountHT + tvaAmount;
    
    // Déterminer type de document
    const docType = determineDocumentType(amountHT, projectTotal);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans print:bg-white text-slate-800">
            {/* Non-printable Screen Header Controls */}
            <div className="print:hidden w-full max-w-4xl mx-auto py-6 px-4 sm:px-8 flex items-center justify-between">
                <button 
                    onClick={() => {
                        if (window.history.length > 2) {
                            navigate(-1);
                        } else {
                            navigate(isClient ? "/user/dashboard" : "/admin/dashboard");
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </button>
                
                <div className="flex items-center gap-3">
                    {/* Badge Type Document */}
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        docType.isInvoice 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                        {docType.isInvoice ? 'Facture' : 'Devis'}
                    </div>
                    
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>
                </div>
            </div>

            {/* A4 Printable Document Container */}
            <div className="max-w-4xl mx-auto bg-white sm:rounded-2xl sm:shadow-lg overflow-hidden print:shadow-none print:rounded-none relative">
                
                {/* Status Watermark for Paid Invoices */}
                {invoice.status === 'paid' && docType.isInvoice && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none opacity-[0.03] print:opacity-[0.05]">
                        <div className="text-[180px] font-black border-[20px] border-green-600 text-green-600 px-12 rounded-[50px] uppercase">
                            Payée
                        </div>
                    </div>
                )}

                <div className="p-12 sm:p-20">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-100 pb-10">
                        <div>
                            <div className="mb-6">
                                <BrandLogo size="md" />
                            </div>
                            <div className="text-slate-500 text-sm space-y-1">
                                <p>123 Avenue des Entreprises</p>
                                <p>Marrakech, Maroc 40000</p>
                                <p>contact@kalyo.ma</p>
                                <p>+212 608289191</p>
                                <p className="text-xs mt-2 font-mono text-slate-400">ICE: 001234567000089</p>
                            </div>
                        </div>

                        <div className="text-right space-y-2">
                            <h2 className={`text-4xl font-black uppercase tracking-widest mb-4 ${
                                docType.isInvoice ? 'text-slate-200' : 'text-amber-200'
                            }`}>
                                {docType.type}
                            </h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">
                                    {docType.label} :
                                </span>
                                <span className="font-black text-slate-800 text-base">
                                    {docType.prefix}-{invoice.id?.toString().padStart(5, '0') || '00000'}
                                </span>
                                
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">
                                    Date d'émission :
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {formatDate(invoice.issued_date || invoice.created_at)}
                                </span>
                                
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">
                                    Échéance :
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {formatDate(invoice.due_date) || 'N/A'}
                                </span>
                                
                                {/* <span className="font-bold text-slate-400 uppercase tracking-wider text-xs">
                                    Statut :
                                </span>
                                <span className={`font-semibold ${docType.statusColor}`}>
                                    {docType.status}
                                </span> */}
                            </div>
                        </div>
                    </div>

                    {/* Client Section */}
                    <div className="mt-10 mb-10 flex justify-between">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                                {docType.isInvoice ? 'Facturé à' : 'Client'}
                            </h3>
                            <div className="text-sm space-y-1 text-slate-600">
                                <p className="text-lg font-black text-slate-800">
                                    {invoice.client_name || invoice.client?.name || 'Client'}
                                </p>
                                <p>{invoice.client_address || invoice.client?.address || ''}</p>
                                {invoice.client_ice && (
                                    <p className="font-mono text-xs text-slate-500">ICE: {invoice.client_ice}</p>
                                )}
                                <p>{invoice.client_email || invoice.client?.email || ''}</p>
                                <p>{invoice.client_phone || invoice.client?.phone || ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mt-12">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-900 text-xs font-black uppercase tracking-widest text-slate-900">
                                    <th className="py-3 w-1/2">Designation</th>
                                    {/* <th className="py-3 text-center">Qté</th> */}
                                    <th className="py-3 text-right">Prix U. HT</th>
                                    <th className="py-3 text-right">TVA</th>
                                    <th className="py-3 text-right">Total HT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.services && invoice.services.length > 0 ? (
                                    invoice.services.map((service, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-4">
                                                <div className="font-bold text-slate-900 text-lg">{service.name}</div>
                                            </td>
                                            {/* <td className="py-4 text-center text-slate-700">{service.length}</td> */}
                                            <td className="py-4 text-right font-semibold text-slate-700">
                                                {formatCurrency(service.unit_price || service.price)}
                                            </td>
                                            <td className="py-4 text-right text-slate-500">20%</td>
                                            <td className="py-4 text-right font-black text-slate-900">
                                                {formatCurrency((service.unit_price || service.price) )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-8">
                                            <div className="font-bold text-slate-900 text-xl">Prestations de Services</div>
                                            <div className="text-sm text-slate-500 mt-1 max-w-sm italic">
                                                {docType.isInvoice 
                                                    ? 'Accompagnement complet, exécution technique et gestion opérationnelle pour le projet :'
                                                    : 'Proposition d\'accompagnement pour le projet :'
                                                }
                                                <strong className="text-indigo-600 block mt-1 text-base not-italic">
                                                    {invoice.project_name || 'Projet'}
                                                </strong>
                                            </div>
                                        </td>
                                        <td className="py-8 text-center text-slate-700 align-top">1</td>
                                        <td className="py-8 text-right font-semibold text-slate-700 align-top">
                                            {formatCurrency(amountHT)}
                                        </td>
                                        <td className="py-8 text-right text-slate-500 align-top">20%</td>
                                        <td className="py-8 text-right font-black text-slate-900 text-xl align-top">
                                            {formatCurrency(amountHT)}
                                        </td>
                                    </tr>
                                )}
                                
                                {/* Notes additionnelles */}
                                {invoice.notes && (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-4" colSpan="5">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                Notes Additionnelles
                                            </div>
                                            <div className="text-sm text-slate-600">{invoice.notes}</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-8 flex justify-end">
                        <div className="w-1/2 min-w-[300px] space-y-1">
                            <div className="flex justify-between py-2 text-sm text-slate-600">
                                <span className="font-semibold">Total HT</span>
                                <span className="font-semibold">{formatCurrency(amountHT)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm text-slate-600">
                                <span className="font-semibold">TVA (20%)</span>
                                <span className="font-semibold">{formatCurrency(tvaAmount)}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b-2 border-slate-900">
                                <span className="text-lg font-black text-slate-900 uppercase tracking-widest">
                                    Total TTC
                                </span>
                                <span className="text-2xl font-black text-indigo-600 tracking-tight">
                                    {formatCurrency(parseFloat(amountHT) + parseFloat(tvaAmount))}
                                </span>
                            </div>
                            
                    
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t border-slate-200"></div>
                </div>
            </div>
        </div>
    );
};