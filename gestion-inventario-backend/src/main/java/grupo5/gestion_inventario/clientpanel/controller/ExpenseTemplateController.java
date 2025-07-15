package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.clientpanel.model.ExpenseTemplate;
import grupo5.gestion_inventario.service.ExpenseTemplateService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/templates")
@RequiredArgsConstructor
public class ExpenseTemplateController {

    private final ExpenseTemplateService tplSvc;

    /** Listar plantillas del cliente (opcional filtrado simple) */
    @GetMapping
    public List<ExpenseTemplate> list(@PathVariable Long clientId) {
        // podrías exponer un DTO, aquí se devuelve entidad simple
        return tplSvc.findByClient(clientId);
    }

    /** Crear plantilla */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseTemplate create(@PathVariable Long clientId,
                                  @RequestBody TemplateCreateDto dto) {
        return tplSvc.create(clientId, dto);
    }

    /** Actualizar plantilla */
    @PatchMapping("/{id}")
    public ExpenseTemplate update(@PathVariable Long clientId,
                                  @PathVariable Long id,
                                  @RequestBody TemplateUpdateDto dto) {
        return tplSvc.update(clientId, id, dto);
    }

    /** Eliminar plantilla */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long clientId, @PathVariable Long id) {
        tplSvc.delete(clientId, id);
    }
}
