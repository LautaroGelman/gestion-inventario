// src/main/java/grupo5/gestion_inventario/controller/AdminClientController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/clients")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminClientController {

    private final ClientService clientService;

    /** Alta de cliente + empleado ADMINISTRADOR  */
    @PostMapping
    public ResponseEntity<ClientRowDto> createClient(
            @RequestBody @Valid ClientCreateRequest req) {

        Client saved = clientService.create(req);           // ← usa DTO, no Client

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ClientRowDto.fromEntity(saved));      // mapper estático
    }

    /** Listado con contadores  */
    @GetMapping
    public ResponseEntity<ClientListDto> listClients() {
        long total      = clientService.countAll();
        long basico     = clientService.countByPlan("BASICO");
        long intermedio = clientService.countByPlan("INTERMEDIO");
        long premium    = clientService.countByPlan("PREMIUM");

        List<ClientRowDto> rows = clientService.findAll()
                .stream()
                .map(ClientRowDto::fromEntity)
                .toList();

        ClientListDto dto = new ClientListDto(
                total, basico, intermedio, premium, rows);

        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/{id}/inactive")
    public ResponseEntity<Void> inactivateClient(@PathVariable Long id) {
        clientService.inactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateClient(@PathVariable Long id) {
        clientService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
