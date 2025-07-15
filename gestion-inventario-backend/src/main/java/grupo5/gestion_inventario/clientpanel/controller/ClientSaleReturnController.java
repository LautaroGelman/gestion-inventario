// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientSaleReturnController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SaleReturnRequest;
import grupo5.gestion_inventario.clientpanel.dto.SaleReturnDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.SaleReturnService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/returns")
public class ClientSaleReturnController {

    private final SaleReturnService   returnService;
    private final EmployeeRepository  employeeRepo;

    public ClientSaleReturnController(SaleReturnService returnService,
                                      EmployeeRepository employeeRepo) {
        this.returnService = returnService;
        this.employeeRepo  = employeeRepo;
    }

    /* ───────────── validación de pertenencia ───────────── */
    private Client validateClient(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /* ───────────── POST /returns ───────────── */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<SaleReturnDto> createReturn(
            @PathVariable Long clientId,
            @RequestBody SaleReturnRequest req,
            Authentication auth) {

        validateClient(clientId, auth);

        // Inyectar el clientId en la petición para la lógica del servicio
        req.setClientId(clientId);

        SaleReturnDto dto = returnService.createSaleReturn(req);
        return ResponseEntity.ok(dto);
    }

    /* ───────────── GET /returns ───────────── */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION')")
    public ResponseEntity<List<SaleReturnDto>> listReturns(
            @PathVariable Long clientId,
            @RequestParam(required = false) Long saleId,
            @RequestParam(required = false) String from,   // yyyy-MM-dd
            @RequestParam(required = false) String to,     // yyyy-MM-dd
            Authentication auth) {

        validateClient(clientId, auth);

        LocalDateTime fromDt = null, toDt = null;
        try {
            if (from != null && !from.isBlank()) {
                fromDt = LocalDate.parse(from).atStartOfDay();
            }
            if (to != null && !to.isBlank()) {
                toDt = LocalDate.parse(to).atTime(23, 59, 59);
            }
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Formato de fecha inválido (yyyy-MM-dd)");
        }

        List<SaleReturnDto> list = returnService.listReturns(clientId, saleId, fromDt, toDt);
        return ResponseEntity.ok(list);
    }
}
