package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.service.ReportesFinancierosService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/reports")
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'CLIENT')") // Solo roles de alto nivel pueden ver reportes
public class ReportesController {

    private final ReportesFinancierosService reportesService;

    public ReportesController(ReportesFinancierosService reportesService) {
        this.reportesService = reportesService;
    }

    @GetMapping("/estado-resultados")
    public ResponseEntity<EstadoResultadosDTO> getEstadoResultados(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportesService.calcularEstadoResultados(clientId, from, to));
    }

    @GetMapping("/nomina")
    public ResponseEntity<NominaDTO> getNomina(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportesService.calcularMetricasNomina(clientId, from, to));
    }

    @GetMapping("/flujo-caja")
    public ResponseEntity<FlujoCajaDTO> getFlujoCaja(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportesService.calcularFlujoCaja(clientId, from, to));
    }

    @GetMapping("/analisis-gastos")
    public ResponseEntity<List<AnalisisGastosDTO>> getAnalisisGastos(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportesService.analizarGastos(clientId, from, to));
    }

    @GetMapping("/valor-inventario")
    public ResponseEntity<ValorInventarioDTO> getValorInventario(@PathVariable Long clientId) {
        return ResponseEntity.ok(reportesService.calcularValorInventario(clientId));
    }
}