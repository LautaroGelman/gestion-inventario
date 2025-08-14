// backend/src/main/java/grupo5/gestion_inventario/service/CashRegisterSessionService.java
package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.dto.CloseSessionRequest;
import grupo5.gestion_inventario.clientpanel.dto.OpenSessionRequest;
import grupo5.gestion_inventario.clientpanel.model.CashRegisterSession;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.clientpanel.repository.CashRegisterSessionRepository;
import grupo5.gestion_inventario.clientpanel.repository.SaleRepository;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class CashRegisterSessionService {

    private final CashRegisterSessionRepository sessionRepo;
    private final EmployeeRepository            employeeRepo;
    private final SucursalRepository            sucursalRepo;
    private final SaleRepository                saleRepo;

    public CashRegisterSessionService(CashRegisterSessionRepository sessionRepo,
                                      EmployeeRepository            employeeRepo,
                                      SucursalRepository            sucursalRepo,
                                      SaleRepository                saleRepo) {
        this.sessionRepo = sessionRepo;
        this.employeeRepo= employeeRepo;
        this.sucursalRepo= sucursalRepo;
        this.saleRepo    = saleRepo;
    }

    /* ============================================================
     *  SESIÓN ACTUAL
     * ============================================================ */
    public Optional<CashRegisterSession> getCurrentSession(String employeeEmail,
                                                           Long   sucursalId) {

        Employee emp = validarEmpleado(employeeEmail, sucursalId);
        return sessionRepo.findByEmployeeIdAndSucursalIdAndStatus(
                emp.getId(), sucursalId, "OPEN");
    }

    /* ============================================================
     *  ABRIR CAJA
     * ============================================================ */
    @Transactional
    public CashRegisterSession openSession(OpenSessionRequest req,
                                           String            employeeEmail,
                                           Long              sucursalId) {

        Employee emp = validarEmpleado(employeeEmail, sucursalId);

        if (getCurrentSession(employeeEmail, sucursalId).isPresent()) {
            throw new IllegalStateException(
                    "El empleado ya tiene una sesión abierta en esta sucursal");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new IllegalStateException("Sucursal no encontrada"));

        CashRegisterSession session = new CashRegisterSession();
        session.setEmployee     (emp);
        session.setClient       (emp.getClient());
        session.setSucursal     (sucursal);
        session.setOpeningTime  (LocalDateTime.now());
        session.setInitialAmount(req.getInitialAmount());
        session.setStatus       ("OPEN");

        return sessionRepo.save(session);
    }

    /* ============================================================
     *  CERRAR CAJA
     * ============================================================ */
    @Transactional
    public CashRegisterSession closeSession(CloseSessionRequest req,
                                            String            employeeEmail,
                                            Long              sucursalId) {

        CashRegisterSession session = getCurrentSession(employeeEmail, sucursalId)
                .orElseThrow(() ->
                        new IllegalStateException("No hay sesión abierta para este empleado en la sucursal"));

        LocalDateTime closingTime = LocalDateTime.now();

        /* total de ventas del empleado en esa sucursal y ventana de tiempo */
        BigDecimal salesTotal = saleRepo.sumTotalAmountByEmployeeAndDateBetween(
                session.getEmployee().getId(),
                sucursalId,
                session.getOpeningTime(),
                closingTime
        );

        BigDecimal expected = session.getInitialAmount().add(salesTotal);
        BigDecimal counted  = req.getCountedAmount();
        BigDecimal diff     = counted.subtract(expected);

        session.setClosingTime   (closingTime);
        session.setExpectedAmount(expected);
        session.setCountedAmount (counted);
        session.setDifference    (diff);
        session.setStatus        ("CLOSED");

        return sessionRepo.save(session);
    }

    /* ============================================================
     *  VALIDACIÓN DE EMPLEADO / SUCURSAL
     * ============================================================ */
    private Employee validarEmpleado(String email, Long sucursalId) {
        Employee emp = employeeRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        boolean propietario = emp.getRole() == EmployeeRole.PROPIETARIO;

        if (!propietario) {
            if (emp.getSucursal() == null ||
                    !emp.getSucursal().getId().equals(sucursalId)) {
                throw new IllegalStateException("Empleado no pertenece a la sucursal");
            }
        }
        return emp;
    }

    /* ============================================================
     *  LEGACY — VERSIÓN PRE-SUCURSAL (comentada)
     * ============================================================
     *
     * public Optional<CashRegisterSession> getCurrentSession(String email) { … }
     * public CashRegisterSession openSession(OpenSessionRequest req, String email) { … }
     * public CashRegisterSession closeSession(CloseSessionRequest req, String email) { … }
     *
     */
}
