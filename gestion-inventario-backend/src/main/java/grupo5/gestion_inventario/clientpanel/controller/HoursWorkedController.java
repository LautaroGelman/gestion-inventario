package grupo5.gestion_inventario.clientpanel.controller;

import java.math.BigDecimal;

import grupo5.gestion_inventario.clientpanel.model.HoursWorked;
import grupo5.gestion_inventario.service.HoursWorkedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees/{employeeId}/hours-worked")
@RequiredArgsConstructor
public class HoursWorkedController {

    private final HoursWorkedService hwSvc;

    /** Petición JSON simple */
    public record HoursWorkedRequest(int year, int month, BigDecimal hours) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HoursWorked record(@PathVariable Long employeeId,
                              @RequestBody HoursWorkedRequest body) {
        return hwSvc.recordHours(employeeId, body.year(), body.month(), body.hours());
    }
}
