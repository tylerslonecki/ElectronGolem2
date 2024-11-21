#' The application User-Interface
#'
#' @param request Internal parameter for `{shiny}`.
#'     DO NOT REMOVE.
#' @import shiny
#' @noRd
app_ui <- function(request) {
  tagList(
    golem_add_external_resources(),  # Correctly call the function here
    fluidPage(
      titlePanel("My Shiny App"),
      sidebarLayout(
        sidebarPanel(
          textInput("text_input", "Enter text:", value = ""),
          actionButton("action_btn", "Submit")
        ),
        mainPanel(
          textOutput("text_output")
        )
      )
    )
  )
}


#' Add external Resources to the Application
#'
#' This function is internally used to add external
#' resources inside the Shiny application.
#'
#' @import shiny
#' @importFrom golem add_resource_path activate_js favicon bundle_resources
#' @noRd
golem_add_external_resources <- function() {
  add_resource_path(
    "www",
    app_sys("app/www")
  )

  tags$head(
    favicon(),
    bundle_resources(
      path = app_sys("app/www"),
      app_title = "ElectronGolem"
    )
    # Add here other external resources
    # for example, you can add shinyalert::useShinyalert()
  )
}

