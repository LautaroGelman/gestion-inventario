package grupo5.gestion_inventario.service;

import grupo5.gestion_inventario.clientpanel.model.Expense;
import grupo5.gestion_inventario.clientpanel.model.ExpenseCategory;
import grupo5.gestion_inventario.clientpanel.model.ExpenseTemplate;
import grupo5.gestion_inventario.clientpanel.model.MonthClosure;
import grupo5.gestion_inventario.clientpanel.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MonthClosureService {

    private final MonthClosureRepository closureRepo;
    private final ExpenseRepository      expenseRepo;
    private final ExpenseTemplateRepository tplRepo;
    private final SalaryRateRepository   rateRepo;
    private final HoursWorkedRepository  hoursRepo;
    private final ExpenseCategoryRepository catRepo;
    private final ClientRepository clientRepo;

    /** Cierra el mes para un cliente (idempotente). */
    @Transactional
    public void closeMonth(Long clientId, YearMonth ym) {
        String key = ym + ":" + clientId;
        if (closureRepo.existsByUniqueKey(key)) return; // ya cerrado

        Client client = clientRepo.getReferenceById(clientId);
        LocalDate lastDay = ym.atEndOfMonth();

        // 1) SUELDOS
        ExpenseCategory salaryCat = catRepo.findByNameAndClientId("Sueldos", clientId)
                .orElseThrow(() -> new IllegalStateException("Categoría 'Sueldos' falta"));

        for (Employee emp : client.getEmployees()) {
            BigDecimal hours = hoursRepo.findByEmployeeIdAndYearAndMonth(
                            emp.getId(), ym.getYear(), ym.getMonthValue())
                    .map(h -> h.getHours())
                    .orElse(null);

            if (hours == null) continue; // sueldo fijo se maneja por plantilla

            BigDecimal rate = rateRepo.findTopByEmployeeIdAndDate(
                            emp.getId(), lastDay)
                    .map(r -> r.getHourlyRate())
                    .orElse(BigDecimal.ZERO);

            BigDecimal amount = hours.multiply(rate).negate(); // egreso

            expenseRepo.save(new Expense(client, salaryCat, lastDay,
                    amount, emp, "Sueldo " + ym));
        }

        // 2) PLANTILLAS
        for (ExpenseTemplate tpl : tplRepo.findActiveTemplates(clientId, lastDay)) {
            expenseRepo.save(new Expense(client, tpl.getCategory(), lastDay,
                    tpl.getAmount(), null, tpl.getDescription()));
        }

        // 3) Marcar cierre
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
        clientRepo.findAll()
                .forEach(c -> closeMonth(c.getId(), prev));
    }
}
