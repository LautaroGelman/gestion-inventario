package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.service.ExpenseCategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/categories")
@RequiredArgsConstructor
public class ExpenseCategoryController {

    private final ExpenseCategoryService svc;

    /** Listar categorías activas */
    @GetMapping
    public List<ExpenseCategoryDto> list(@PathVariable Long clientId) {
        return svc.listActive(clientId);
    }

    /** Crear nueva categoría */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseCategoryDto create(@PathVariable Long clientId,
                                     @RequestBody CategoryCreateDto dto) {
        return svc.create(clientId, dto);
    }

    /** Actualizar nombre / default */
    @PatchMapping("/{id}")
    public ExpenseCategoryDto update(@PathVariable Long clientId,
                                     @PathVariable Long id,
                                     @RequestBody CategoryUpdateDto dto) {
        return svc.update(clientId, id, dto);
    }

    /** Desactivar (soft-delete) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long clientId, @PathVariable Long id) {
        svc.deactivate(clientId, id);
    }
}
