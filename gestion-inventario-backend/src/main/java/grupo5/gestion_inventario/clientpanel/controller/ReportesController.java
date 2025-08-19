// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ReportesController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.ReportesFinancierosService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/reports")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR')") // Solo alto nivel ve reportes
public class ReportesController {

    private final ReportesFinancierosService reportesService;
    private final EmployeeRepository employeeRepo;

    public ReportesController(ReportesFinancierosService reportesService,
                              EmployeeRepository employeeRepo) {
        this.reportesService = reportesService;
        this.employeeRepo = employeeRepo;
    }

    /* -------- Validación de pertenencia al cliente (patrón actual) -------- */
    private Client validateClient(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    @GetMapping("/estado-resultados")
    public ResponseEntity<EstadoResultadosDTO> getEstadoResultados(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication auth) {

        validateClient(clientId, auth);
        return ResponseEntity.ok(reportesService.calcularEstadoResultados(clientId, from, to));
    }

    @GetMapping("/nomina")
    public ResponseEntity<NominaDTO> getNomina(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication auth) {

        validateClient(clientId, auth);
        return ResponseEntity.ok(reportesService.calcularMetricasNomina(clientId, from, to));
    }

    @GetMapping("/flujo-caja")
    public ResponseEntity<FlujoCajaDTO> getFlujoCaja(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication auth) {

        validateClient(clientId, auth);
        return ResponseEntity.ok(reportesService.calcularFlujoCaja(clientId, from, to));
    }

    @GetMapping("/analisis-gastos")
    public ResponseEntity<List<AnalisisGastosDTO>> getAnalisisGastos(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication auth) {

        validateClient(clientId, auth);
        return ResponseEntity.ok(reportesService.analizarGastos(clientId, from, to));
    }

    @GetMapping("/valor-inventario")
    public ResponseEntity<ValorInventarioDTO> getValorInventario(
            @PathVariable Long clientId,
            Authentication auth) {

        validateClient(clientId, auth);
        return ResponseEntity.ok(reportesService.calcularValorInventario(clientId));
    }
}
