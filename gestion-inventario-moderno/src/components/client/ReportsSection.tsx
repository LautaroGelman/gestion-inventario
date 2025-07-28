
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section } from "../section";
import EstadoResultadosReport from "./reports/EstadoResultadosReport";
import NominaReport from "./reports/NominaReport";
import FlujoCajaReport from "./reports/FlujoCajaReport";
import AnalisisGastosReport from "./reports/AnalisisGastosReport";
import ValorInventarioReport from "./reports/ValorInventarioReport";

const ReportsSection = () => {
    return (
        <Section title="Reportes Financieros y Contabilidad">
            <Tabs defaultValue="estado-resultados" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
                    <TabsTrigger value="estado-resultados">Estado de Resultados</TabsTrigger>
                    <TabsTrigger value="nomina">Nómina</TabsTrigger>
                    <TabsTrigger value="flujo-caja">Flujo de Caja</TabsTrigger>
                    <TabsTrigger value="analisis-gastos">Análisis de Gastos</TabsTrigger>
                    <TabsTrigger value="valor-inventario">Valor de Inventario</TabsTrigger>
                </TabsList>

                {/* Contenido de cada Pestaña */}
                <TabsContent value="estado-resultados">
                    <EstadoResultadosReport />
                </TabsContent>
                <TabsContent value="nomina">
                    <NominaReport />
                </TabsContent>
                <TabsContent value="flujo-caja">
                    <FlujoCajaReport />
                </TabsContent>
                <TabsContent value="analisis-gastos">
                    <AnalisisGastosReport />
                </TabsContent>
                <TabsContent value="valor-inventario">
                    <ValorInventarioReport />
                </TabsContent>
            </Tabs>
        </Section>
    );
};

export default ReportsSection;