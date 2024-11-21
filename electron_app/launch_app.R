# library(golem)
# options(shiny.port = 1234)
# options(shiny.host = '0.0.0.0')
# ElectronGolem::run_app()



library(golem)


# options(shiny.port = 1234)
options(shiny.host = '127.0.0.1') # Use localhost for security

# Run the Shiny app and capture the selected port
shiny_port <- httpuv::randomPort()

# Output the selected port to stdout
cat(sprintf("Selected port: %d\n", shiny_port))

# Run the app on the selected port
ElectronGolem::run_app(options = list(port = shiny_port, launch.browser = FALSE))



# library(shiny)

# options(shiny.host = '127.0.0.1')

# # Run the Shiny app and capture the selected port
# shiny_port <- httpuv::randomPort()

# # Output the selected port to stdout
# cat(sprintf("Selected port: %d\n", shiny_port))

# # Minimal Shiny app for testing
# ui <- fluidPage(
#   titlePanel("Test App"),
#   sidebarLayout(
#     sidebarPanel(
#       sliderInput("obs", "Number of observations:", min = 1, max = 1000, value = 500)
#     ),
#     mainPanel(
#       plotOutput("distPlot")
#     )
#   )
# )

# server <- function(input, output) {
#   output$distPlot <- renderPlot({
#     hist(rnorm(input$obs))
#   })
# }

# # Run the app on the selected port
# shinyApp(ui = ui, server = server, options = list(port = shiny_port, launch.browser = FALSE))
