package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.model.Expense;
import grupo5.gestion_inventario.clientpanel.model.ExpenseCategory;
import grupo5.gestion_inventario.clientpanel.model.ExpenseTemplate;
import grupo5.gestion_inventario.clientpanel.model.MonthClosure;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseCategoryRepository;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseRepository;
import grupo5.gestion_inventario.clientpanel.repository.ExpenseTemplateRepository;
import grupo5.gestion_inventario.clientpanel.repository.HoursWorkedRepository;
import grupo5.gestion_inventario.clientpanel.repository.MonthClosureRepository;
import grupo5.gestion_inventario.clientpanel.repository.SalaryRateRepository;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.ClientRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MonthClosureService {

    private final MonthClosureRepository     closureRepo;
    private final ExpenseRepository          expenseRepo;
    private final ExpenseTemplateRepository  tplRepo;
    private final SalaryRateRepository       rateRepo;
    private final HoursWorkedRepository      hoursRepo;
    private final ExpenseCategoryRepository  catRepo;
    private final ClientRepository           clientRepo;

    /**
     * Cierra el mes para un cliente (idempotente).
     * Genera:
     *  - Gastos de sueldos (por empleado, usando su sucursal).
     *  - Gastos desde plantillas (asignados a una sucursal por defecto del cliente).
     */
    @Transactional
    public void closeMonth(Long clientId, YearMonth ym) {
        String key = ym + ":" + clientId;
        if (closureRepo.existsByUniqueKey(key)) return; // ya cerrado previamente

        Client client = clientRepo.getReferenceById(clientId);
        LocalDate lastDay = ym.atEndOfMonth();

        // Sucursal por defecto (para plantillas y/o fallback)
        Sucursal defaultSucursal = client.getSucursales() != null && !client.getSucursales().isEmpty()
                ? client.getSucursales().get(0)
                : null;

        if (defaultSucursal == null) {
            throw new IllegalStateException("El cliente " + clientId + " no tiene sucursales para registrar gastos.");
        }

        // 1) SUELDOS (egresos negativos)
        ExpenseCategory salaryCat = catRepo.findByNameAndClientId("Sueldos", clientId)
                .orElseThrow(() -> new IllegalStateException("Categoría 'Sueldos' no encontrada para el cliente " + clientId));

        for (Employee emp : client.getEmployees()) {
            // Horas del mes (si no hay, se asume sueldo fijo por plantilla y se omite aquí)
            BigDecimal hours = hoursRepo.findByEmployeeIdAndYearAndMonth(
                            emp.getId(), ym.getYear(), ym.getMonthValue())
                    .map(h -> h.getHours())
                    .orElse(null);

            if (hours == null) continue; // sin horas → no genera gasto variable de sueldo

            BigDecimal rate = rateRepo.findTopByEmployeeIdAndDate(emp.getId(), lastDay)
                    .map(r -> r.getHourlyRate())
                    .orElse(BigDecimal.ZERO);

            BigDecimal amount = hours.multiply(rate).negate(); // egreso

            // Sucursal del empleado (debería existir para no propietarios)
            Sucursal empSucursal = emp.getSucursal();
            if (empSucursal == null) {
                // Si por algún caso extremo es null (p.ej. PROPIETARIO con horas), usamos la default
                empSucursal = defaultSucursal;
            }

            // Constructor NUEVO exige sucursal
            expenseRepo.save(new Expense(
                    client,
                    empSucursal,
                    salaryCat,
                    lastDay,
                    amount,
                    emp,
                    "Sueldo " + ym
            ));
        }

        // 2) PLANTILLAS (egresos fijos o recurrentes)
        for (ExpenseTemplate tpl : tplRepo.findActiveTemplates(clientId, lastDay)) {
            // Si tu ExpenseTemplate tiene sucursal específica (tpl.getSucursal()), podés usarla aquí.
            // Mientras tanto, usamos la sucursal por defecto del cliente.
            expenseRepo.save(new Expense(
                    client,
                    defaultSucursal,
                    tpl.getCategory(),
                    lastDay,
                    tpl.getAmount(),
                    null,
                    tpl.getDescription()
            ));
        }

        // 3) Marcar cierre de mes (idempotente)
        MonthClosure mc = new MonthClosure();
        mc.setClient(client);
        mc.setYear(ym.getYear());
        mc.setMonth(ym.getMonthValue());
        mc.setClosedAt(LocalDateTime.now());
        mc.setUniqueKey(key);
        closureRepo.save(mc);
    }

    /** Cron automático: 1 de cada mes a 00:05 (hora de Mendoza). */
    @Scheduled(cron = "0 5 0 1 * *", zone = "America/Argentina/Mendoza")
    public void autoClosePrevMonth() {
        YearMonth prev = YearMonth.now().minusMonths(1);
        clientRepo.findAll().forEach(c -> closeMonth(c.getId(), prev));
    }
}
