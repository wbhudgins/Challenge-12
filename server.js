const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer')
const cTable = require('console.table')

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const db = mysql.createConnection(
  {
    host: 'localhost',
    user: 'root',
    password: 'RangerUp1515!',
    database: 'company'
  },
  console.log(`Connected to the company database.`)
); 

app.use((req, res) => {
    res.status(404).end();
  });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startInquirer()
  });


function startInquirer() {

    inquirer.prompt([
        {
            name: "menu",
            type: "list",
            message:  "What would you like to do?",
            choices:  [
                "View All Employees",
                "Add Employee",
                "Update Employee Role",
                "View All Roles",
                "Add Role",
                "View All Departments",
                "Add Department",
                "Quit"
            ]
        }
    ])
    .then((data) => {
        switch (data.menu) {
            case "View All Employees":
                printEmployees();
                break;
            case "View All Roles":
                printRoles();
                break;
            case "View All Departments":
                printDepartments();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Update Employee Role":
                updateEmployeeRole();
                break;
            case "Quit":
                console.log("Thank you for using our HR Employee Tracker. Have a great day.");
                break;
            default:
                console.log(`Action (${data.action}) is not supported.`);
                break;
        }
    });
}

function printDepartments() {
    db.query('SELECT * FROM departments;', function (err, results) {
        console.log("\n")
        console.table(results);
      });
      return startInquirer();
}

function printEmployees() {
    db.query('SELECT * FROM employee;', function (err, results) {
        console.log("\n")
        console.table(results);
      });
      return startInquirer();
}

function printRoles() {
    db.query('SELECT * FROM role;', function (err, results) {
        console.log("\n");
        console.table(results)
      });
      return startInquirer();
}

function addDepartment() {
    inquirer
    .prompt([
        {
            name: "department",
            type: "input",
            message: "What is the name of the department?"
        },
    ])
    .then((data) => {
        db.query(`INSERT INTO departments (name)
        VALUES
        ("${data.department}");`, function (err, results) {
            if (err) {
                console.log(err);
              }
              console.log("\n")
              console.table(results);
        });
          return startInquirer();
    })
}

function addRole() {
    let departments = ["No Department"];   
    db.query("SELECT * FROM departments;",
        function (err, res) {
            if (err) console.log(err);
            for (let i = 0; i < res.length; i++) {
                if (res[i].name) {
                    departments.push(res[i].name);
                }
            }

            inquirer.prompt([
                {
                    name: "title",
                    type: "input",
                    message: "What is the role title you would like to add?"
                },
                {
                    name: "salary",
                    type: "number",
                    message:  "What is the role salary?"
                },
                {
                    name: "department",
                    type: "list",
                    message: "What is the role department?",
                    choices: departments
                }
            ]).then((data) => {
                let departmentId = null;
                for (let i = 0; i < res.length; i++) {
                    if (res[i].name === data.department) {
                        departmentId = res[i].id;
                        break;
                    }
                }
                db.query(`INSERT INTO role (title, salary, department_id)
                VALUES
                ("${data.title}", "${data.salary}", "${departmentId}");`, function (err, results) {
                    if (err) {
                        console.log(err);
                      }
                      console.log("\n")
                      console.table(results);
                  });
                  return startInquirer()
            });
        }
    );
}

function addEmployee() {
    let roles = ["No Role"];
    let managers = ["No Manager"]; 
    db.query("SELECT * FROM role ",
        function (err, roleRes) {
            if (err) console.log(err);
            for (let i = 0; i < roleRes.length; i++) {
                if (roleRes[i].title) {
                    roles.push(roleRes[i].title);
                }
            }

            db.query("SELECT * from employee ",
                function (err, empRes) {
                    if (err) console.log(err);
                    for (let i = 0; i < empRes.length; i++) {
                        if (empRes[i].first_name) {
                            managers.push(empRes[i].first_name + " " + empRes[i].last_name);
                        }
                    }

                    inquirer.prompt([
                        {
                            name: "firstName",
                            type: "input",
                            message: "What is the employee first name?"
                        },
                        {
                            name: "lastName",
                            type: "input",
                            message:  "What is the employee last name?"
                        },
                        {
                            name: "role",
                            type: "list",
                            message: "What is the employee role?",
                            choices: roles
                        },
                        {
                            name: "manager",
                            type: "list",
                            message: "Who is the employee manager?",
                            choices: managers
                        }
                    ]).then((data) => {
                        // get the role to tie to 
                        let roleId = null;
                        for (let i = 0; i < roleRes.length; i++) {
                            if (roleRes[i].title === data.role) {
                                roleId = roleRes[i].id;
                                break;
                            }
                        }
                        // Get the manager to tie to
                        let managerId = null;
                        for (let i = 0; i < empRes.length; i++) {
                            if (empRes[i].first_name + " " + empRes[i].last_name === data.manager) {
                                managerId = empRes[i].id;
                                break;
                            }
                        }
                        db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                        VALUES
                        ("${data.firstName}", "${data.lastName}", "${roleId}", "${managerId}");`, function (err, results) {
                            if (err) {
                                console.log(err);
                              }
                              console.log("\n")
                              console.table(results);
                          });
                          return startInquirer()
                    });

                }
            );
        }
    );
}

function updateEmployeeRole() {
    let roles = ["No Role"];
    let employees = [];
    // First get the list of roles    
    db.query("SELECT * FROM role ",
        function (err, roleRes) {
            if (err) console.log(err);
            for (let i = 0; i < roleRes.length; i++) {
                if (roleRes[i].title) {
                    roles.push(roleRes[i].title);
                }
            }

            // Next get list of possible managers
            db.query("SELECT * from employee ",
                function (err, empRes) {
                    if (err) console.log(err);
                    for (let i = 0; i < empRes.length; i++) {
                        if (empRes[i].first_name) {
                            employees.push(empRes[i].first_name + " " + empRes[i].last_name);
                        }
                    }

                    inquirer.prompt([
                        {
                            name: "employee",
                            type: "list",
                            message: "Who's role would you like to update?",
                            choices: employees
                        },
                        {
                            name: "role",
                            type: "list",
                            message:  "What is their new role??",
                            choices: roles
                        }
                    ]).then((data) => {
                        // get the role to tie to 
                        let roleId = null;
                        for (let i = 0; i < roleRes.length; i++) {
                            if (roleRes[i].title === data.role) {
                                roleId = roleRes[i].id;
                                break;
                            }
                        }
                        // Get the employee to update to
                        let empid;
                        for (let i = 0; i < empRes.length; i++) {
                            if (empRes[i].first_name + " " + empRes[i].last_name === data.employee) {
                               empid = empRes[i].id
                                break;
                            }
                        }
                        db.query(`UPDATE employee SET role_id = ${roleId} WHERE id = ${empid}; `, function (err, results) {
                            if (err) {
                                console.log(err);
                              }
                              console.log("\n")
                              console.table(results);
                          });
                          return startInquirer()
                    });

                }
            );
        }
    );
}

