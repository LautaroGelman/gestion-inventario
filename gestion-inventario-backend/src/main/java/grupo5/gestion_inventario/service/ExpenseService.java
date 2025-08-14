// backend/src/main/java/grupo5/gestion_inventario/service/ExpenseService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.model.Expense;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository  expenseRepo;
    private final SucursalRepository sucursalRepo;

    public ExpenseService(ExpenseRepository  expenseRepo,
                          SucursalRepository sucursalRepo) {
        this.expenseRepo  = expenseRepo;
        this.sucursalRepo = sucursalRepo;
    }

    /* ============================================================
     *  CREAR MOVIMIENTO CONTABLE
     * ============================================================ */
    @Transactional
    public Expense create(Sucursal sucursal, Expense expense) {
        /* El controlador ya valida cliente-sucursal-empleado.
           Aquí solo vinculamos la entidad y persistimos. */
        expense.setClient  (sucursal.getClient());
        expense.setSucursal(sucursal);
        return expenseRepo.save(expense);
    }

    /* ============================================================
     *  LISTAR POR SUCURSAL
     * ============================================================ */
    @Transactional(readOnly = true)
    public List<Expense> findBySucursalId(Long sucursalId) {
        if (!sucursalRepo.existsById(sucursalId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Sucursal no encontrada: " + sucursalId);
        }
        return expenseRepo.findBySucursalId(sucursalId);
    }

    /* ============================================================
     *  ELIMINAR MOVIMIENTO
     * ============================================================ */
    @Transactional
    public boolean delete(Long sucursalId, Long expenseId) {

        return expenseRepo.findById(expenseId)
                .filter(e -> e.getSucursal().getId().equals(sucursalId))
                .map(e -> { expenseRepo.delete(e); return true; })
                .orElse(false);
    }

    /* ============================================================
     *  LEGACY (pre-sucursal) – comentado para referencia
     * ============================================================
     *
     * public Expense create(Long clientId, Expense exp) { … }
     * public List<Expense> findByClientId(Long clientId) { … }
     * public boolean delete(Long clientId, Long expenseId) { … }
     *
     */
}
